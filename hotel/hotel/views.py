import random
import smtplib
import socket
import ssl
from datetime import timedelta
from email.message import EmailMessage

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    BookingDate,
    EmailVerificationCode,
    Feedback,
    Luxe,
    LuxePlus,
    LuxePremium,
    PromotionEvent,
    Room,
    Standard,
    UserNotification,
    UserProfile,
)
from .serializers import (
    CancelBookingSerializer,
    FeedBackSerializer,
    LoginSerializer,
    NotificationReadSerializer,
    ProfileUpdateSerializer,
    PromotionTrackSerializer,
    RegisterSerializer,
    RequestBronSerializer,
    RequestSerializer,
    VerifyRegisterSerializer,
)


def clean_text(value):
    if value is None:
        return ''
    value = str(value).strip()
    if value.lower() in {'', 'undefined', 'null', 'none'}:
        return ''
    return value


def normalize_room_type(room_type):
    value = clean_text(room_type).lower()
    mapping = {
        'standard': 'standard',
        'luxe': 'luxe',
        'luxeplus': 'luxe plus',
        'luxe plus': 'luxe plus',
        'luxe-plus': 'luxe plus',
        'luxe_plus': 'luxe plus',
        'luxepremium': 'luxe premium',
        'luxe premium': 'luxe premium',
        'luxe-premium': 'luxe premium',
        'luxe_premium': 'luxe premium',
    }
    return mapping.get(value, value)


def normalize_booking_status_for_ui(raw_status):
    value = clean_text(raw_status).lower()
    if value in {'cancelled', 'canceled', 'cancel', 'отменена'}:
        return 'Отменена'
    if value in {'confirmed', 'approved', 'accepted', 'подтверждена'}:
        return 'Подтверждена'
    return 'Новая заявка'


def safe_iso_datetime(value):
    if not value:
        return ''
    try:
        return value.isoformat()
    except Exception:
        return str(value)


def generate_code():
    return f'{random.randint(100000, 999999)}'


ROOM_TYPE_SETTINGS = {
    'standard': {
        'model': Standard,
        'default_price': 2200,
        'default_persons': 2,
    },
    'luxe': {
        'model': Luxe,
        'default_price': 3400,
        'default_persons': 3,
    },
    'luxe plus': {
        'model': LuxePlus,
        'default_price': 3700,
        'default_persons': 3,
    },
    'luxe premium': {
        'model': LuxePremium,
        'default_price': 4200,
        'default_persons': 4,
    },
}


def get_room_type_config(room_type):
    normalized_type = normalize_room_type(room_type)
    return ROOM_TYPE_SETTINGS.get(normalized_type), normalized_type


def get_room_type_instances(room_type):
    config, normalized_type = get_room_type_config(room_type)
    if not config:
        return None, normalized_type
    return config['model'].objects.all(), normalized_type


def get_room_type_rooms(room_type):
    instances, normalized_type = get_room_type_instances(room_type)
    if instances is None:
        return Room.objects.none(), normalized_type

    room_ids = []
    for instance in instances.prefetch_related('rooms'):
        room_ids.extend(instance.rooms.values_list('id', flat=True))

    return Room.objects.filter(id__in=room_ids).distinct().order_by('number'), normalized_type


def get_room_type_capacity(room_type):
    config, normalized_type = get_room_type_config(room_type)
    if not config:
        return 0, normalized_type

    instances = config['model'].objects.all()
    persons_value = (
        instances.values_list('persons', flat=True).first()
        if instances.exists()
        else config['default_persons']
    )
    return int(persons_value or config['default_persons']), normalized_type


def get_room_type_price(room_type):
    config, normalized_type = get_room_type_config(room_type)
    if not config:
        return 0, normalized_type

    instances = config['model'].objects.all()
    price_value = (
        instances.values_list('price', flat=True).first()
        if instances.exists()
        else config['default_price']
    )
    return int(price_value or config['default_price']), normalized_type


def get_free_rooms(room_type, start_date, end_date):
    rooms_qs, normalized_type = get_room_type_rooms(room_type)

    free_rooms = []
    for room in rooms_qs:
        has_overlap = BookingDate.objects.filter(
            room=room,
            start_date__lt=end_date,
            end_date__gt=start_date,
            status__in=['new', 'confirmed'],
        ).exists()

        if not has_overlap:
            free_rooms.append(room)

    return free_rooms, normalized_type


def send_code_email(email, code):
    host = clean_text(getattr(settings, 'EMAIL_HOST', ''))
    port = int(getattr(settings, 'EMAIL_PORT', 587) or 587)
    username = clean_text(getattr(settings, 'EMAIL_HOST_USER', ''))
    password = clean_text(getattr(settings, 'EMAIL_HOST_PASSWORD', ''))
    from_email = clean_text(getattr(settings, 'DEFAULT_FROM_EMAIL', '')) or username
    timeout = int(getattr(settings, 'EMAIL_TIMEOUT', 15) or 15)
    use_ssl = bool(getattr(settings, 'EMAIL_USE_SSL', False))
    use_tls = bool(getattr(settings, 'EMAIL_USE_TLS', True))

    if not host or not username or not password or not from_email:
        raise RuntimeError('Почтовые настройки не заполнены на сервере')

    message = EmailMessage()
    message['Subject'] = 'Код подтверждения регистрации'
    message['From'] = from_email
    message['To'] = email
    message.set_content(
        f'Ваш код подтверждения: {code}\n\n'
        'Код действует 10 минут.'
    )

    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as server:
                server.login(username, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=timeout) as server:
                server.ehlo()
                if use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                server.login(username, password)
                server.send_message(message)
    except smtplib.SMTPAuthenticationError:
        raise RuntimeError('Сервер почты отклонил логин или пароль')
    except smtplib.SMTPRecipientsRefused:
        raise RuntimeError('Почтовый сервер отклонил адрес получателя')
    except (socket.timeout, TimeoutError):
        raise RuntimeError('Почтовый сервер не ответил вовремя')
    except ssl.SSLError as exc:
        raise RuntimeError(f'Ошибка SSL/TLS при подключении к почте: {exc}')
    except smtplib.SMTPException as exc:
        raise RuntimeError(f'Ошибка SMTP: {exc}')
    except OSError as exc:
        raise RuntimeError(f'Ошибка подключения к почте: {exc}')


def send_booking_email(email, booking, action='created'):
    return True


def create_notification(user, email, title, message, notification_type):
    return UserNotification.objects.create(
        user=user,
        email=clean_text(email),
        title=title,
        message=message,
        notification_type=notification_type,
    )


def serialize_user(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return {
        'id': user.id,
        'name': clean_text(user.first_name),
        'email': clean_text(user.email).lower(),
        'phone': clean_text(profile.phone),
        'createdAt': safe_iso_datetime(user.date_joined),
    }


class FeedBack(APIView):
    def post(self, request):
        serializer = FeedBackSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'message': 'Ошибка при отправке обратной связи',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response(
            {
                'message': 'Обратная связь успешно отправлена',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterRequestView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные регистрации', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        email = clean_text(data['email']).lower()

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'message': 'Пользователь с таким email уже существует'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = generate_code()

        EmailVerificationCode.objects.filter(
            email__iexact=email,
            purpose='register',
            is_used=False,
        ).delete()

        verification = EmailVerificationCode.objects.create(
            email=email,
            code=code,
            purpose='register',
            payload_name=clean_text(data['name']),
            payload_phone=clean_text(data.get('phone', '')),
            payload_password=data['password'],
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        try:
            send_code_email(email, code)
        except Exception as exc:
            verification.delete()
            return Response(
                {'message': f'Не удалось отправить письмо: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'message': 'Код подтверждения отправлен на email'},
            status=status.HTTP_200_OK,
        )


class RegisterVerifyView(APIView):
    def post(self, request):
        serializer = VerifyRegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные подтверждения', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = clean_text(serializer.validated_data['email']).lower()
        code = clean_text(serializer.validated_data['code'])

        verification = (
            EmailVerificationCode.objects
            .filter(email__iexact=email, purpose='register', is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not verification:
            return Response(
                {'message': 'Код подтверждения не найден'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if verification.is_expired():
            return Response(
                {'message': 'Срок действия кода истёк'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.code != code:
            return Response(
                {'message': 'Неверный код подтверждения'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'message': 'Пользователь с таким email уже существует'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                email=email,
                password=verification.payload_password,
                first_name=clean_text(verification.payload_name),
            )
            UserProfile.objects.create(
                user=user,
                phone=clean_text(verification.payload_phone),
            )
            verification.user = user
            verification.is_used = True
            verification.save(update_fields=['user', 'is_used'])

            create_notification(
                user=user,
                email=email,
                title='Регистрация подтверждена',
                message='Ваш аккаунт успешно подтверждён и активирован.',
                notification_type='auth',
            )

        return Response(
            {
                'message': 'Регистрация успешно подтверждена',
                'user': serialize_user(user),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные для входа', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = clean_text(serializer.validated_data['email']).lower()
        password = serializer.validated_data['password']

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            return Response(
                {'message': 'Неверный email или пароль'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        create_notification(
            user=user,
            email=email,
            title='Вход в аккаунт',
            message='Выполнен успешный вход в аккаунт.',
            notification_type='auth',
        )

        return Response(
            {
                'message': 'Вход выполнен успешно',
                'user': serialize_user(user),
            },
            status=status.HTTP_200_OK,
        )


class ProfileUpdateView(APIView):
    def post(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные профиля', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        user = User.objects.filter(id=data['user_id']).first()

        if not user:
            return Response(
                {'message': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND,
            )

        normalized_email = clean_text(data['email']).lower()
        conflict_user = User.objects.filter(email__iexact=normalized_email).exclude(id=user.id).first()
        if conflict_user:
            return Response(
                {'message': 'Этот email уже используется другим пользователем'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.first_name = clean_text(data['name'])
        user.email = normalized_email
        user.username = normalized_email
        user.save(update_fields=['first_name', 'email', 'username'])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = clean_text(data['phone'])
        profile.save(update_fields=['phone'])

        return Response(
            {
                'message': 'Профиль успешно обновлён',
                'user': serialize_user(user),
            },
            status=status.HTTP_200_OK,
        )


class ReturnFreeRooms(APIView):
    def post(self, request):
        serializer = RequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные для поиска номеров', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        start_date = data['start_date']
        end_date = data['end_date']
        persons = int(data['persons'])
        selected_type = normalize_room_type(data.get('type', ''))

        if end_date <= start_date:
            return Response(
                {'message': 'Дата выезда должна быть позже даты заезда'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        room_types = ['standard', 'luxe', 'luxe plus', 'luxe premium']
        response_data = {}

        for room_type in room_types:
            capacity, normalized_type = get_room_type_capacity(room_type)
            if persons > capacity:
                response_data[normalized_type] = 0
                continue

            free_rooms, _ = get_free_rooms(room_type, start_date, end_date)
            response_data[normalized_type] = len(free_rooms)

        if selected_type:
            if selected_type not in response_data:
                return Response(
                    {'message': 'Неизвестный тип номера'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {
                    'message': 'Свободные номера получены',
                    'data': {selected_type: response_data[selected_type]},
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'message': 'Свободные номера получены',
                'data': response_data,
            },
            status=status.HTTP_200_OK,
        )


class Book(APIView):
    def post(self, request):
        serializer = RequestBronSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные бронирования', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        start_date = data['start_date']
        end_date = data['end_date']
        room_type = normalize_room_type(data['type'])
        amount = int(data['amount'])
        nights = int(data['nights'])
        first_name = clean_text(data['first_name'])
        last_name = clean_text(data['last_name'])
        phone_number = clean_text(data['phone_number'])
        email = clean_text(data['email']).lower()
        comment = clean_text(data.get('comment', ''))
        promo_code = clean_text(data.get('promo_code', ''))
        promo_discount = int(data.get('promo_discount', 0) or 0)
        total_price = int(data.get('total_price', 0) or 0)

        if end_date <= start_date:
            return Response(
                {'message': 'Дата выезда должна быть позже даты заезда'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        capacity, normalized_type = get_room_type_capacity(room_type)
        if not capacity:
            return Response(
                {'message': 'Неизвестный тип номера'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount < 1:
            return Response(
                {'message': 'Количество гостей должно быть не меньше 1'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > capacity:
            return Response(
                {'message': f'Для номера "{normalized_type}" доступно максимум {capacity} гостя(ей)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        free_rooms, _ = get_free_rooms(room_type, start_date, end_date)
        if not free_rooms:
            return Response(
                {'message': 'Свободных номеров на выбранные даты нет'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_room = free_rooms[0]
        price, _ = get_room_type_price(room_type)
        calculated_total = max((price * nights) - promo_discount, 0)

        if total_price <= 0:
            total_price = calculated_total

        user = User.objects.filter(email__iexact=email).first()

        booking = BookingDate.objects.create(
            user=user,
            room=selected_room,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            email=email,
            comment=comment,
            amount=amount,
            nights=nights,
            price=price,
            type=normalized_type,
            number=str(selected_room.number),
            free_rooms=', '.join(str(room.number) for room in free_rooms),
            promo_code=promo_code,
            promo_discount=promo_discount,
            total_price=total_price,
            start_date=start_date,
            end_date=end_date,
            status='new',
        )

        selected_room.booked.add(booking)

        if user:
            create_notification(
                user=user,
                email=email,
                title='Создано бронирование',
                message=(
                    f'Создано бронирование {booking.booking_number} '
                    f'на номер {normalized_type} ({selected_room.number}).'
                ),
                notification_type='booking_created',
            )

        send_booking_email(email, booking, action='created')

        return Response(
            {
                'message': 'Бронирование успешно создано',
                'booking': {
                    'id': booking.id,
                    'booking_number': booking.booking_number,
                    'room_number': clean_text(booking.number),
                    'type': clean_text(booking.type),
                    'status': clean_text(booking.status),
                    'status_label': normalize_booking_status_for_ui(booking.status),
                    'created_at': safe_iso_datetime(booking.created_at),
                    'start_date': booking.start_date.isoformat() if booking.start_date else '',
                    'end_date': booking.end_date.isoformat() if booking.end_date else '',
                    'amount': booking.amount,
                    'price': booking.price,
                    'promo_code': clean_text(booking.promo_code),
                    'promo_discount': booking.promo_discount,
                    'total_price': booking.total_price,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MyBookingsView(APIView):
    def post(self, request):
        email = clean_text(request.data.get('email')).lower()

        if not email:
            return Response(
                {'message': 'Не указан email'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bookings = BookingDate.objects.filter(email__iexact=email).order_by('-created_at')

        result = []
        for booking in bookings:
            result.append({
                'id': booking.id,
                'booking_number': clean_text(booking.booking_number),
                'first_name': clean_text(booking.first_name),
                'last_name': clean_text(booking.last_name),
                'phone_number': clean_text(booking.phone_number),
                'email': clean_text(booking.email).lower(),
                'comment': clean_text(booking.comment),
                'amount': booking.amount,
                'nights': booking.nights,
                'price': booking.price,
                'type': clean_text(booking.type),
                'room_number': clean_text(booking.number),
                'promo_code': clean_text(booking.promo_code),
                'promo_discount': booking.promo_discount,
                'total_price': booking.total_price,
                'start_date': booking.start_date.isoformat() if booking.start_date else '',
                'end_date': booking.end_date.isoformat() if booking.end_date else '',
                'status': clean_text(booking.status),
                'status_label': normalize_booking_status_for_ui(booking.status),
                'created_at': safe_iso_datetime(booking.created_at),
                'updated_at': safe_iso_datetime(booking.updated_at),
            })

        return Response(
            {
                'message': 'Бронирования получены',
                'bookings': result,
            },
            status=status.HTTP_200_OK,
        )


class CancelBookingView(APIView):
    def post(self, request):
        serializer = CancelBookingSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные отмены', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        booking = BookingDate.objects.filter(id=data['booking_id']).first()

        if not booking:
            return Response(
                {'message': 'Бронирование не найдено'},
                status=status.HTTP_404_NOT_FOUND,
            )

        request_email = clean_text(data.get('email', '')).lower()
        request_user_id = data.get('user_id')

        if request_user_id and booking.user_id and booking.user_id != request_user_id:
            return Response(
                {'message': 'Нет доступа к этому бронированию'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request_email and clean_text(booking.email).lower() != request_email:
            return Response(
                {'message': 'Нет доступа к этому бронированию'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status == 'cancelled':
            return Response(
                {'message': 'Бронирование уже отменено'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])

        if booking.user:
            create_notification(
                user=booking.user,
                email=booking.email,
                title='Бронирование отменено',
                message=f'Бронирование {booking.booking_number} было отменено.',
                notification_type='booking_cancelled',
            )

        send_booking_email(clean_text(booking.email).lower(), booking, action='cancelled')

        return Response(
            {
                'message': 'Бронирование успешно отменено',
                'booking': {
                    'id': booking.id,
                    'booking_number': clean_text(booking.booking_number),
                    'status': clean_text(booking.status),
                    'status_label': normalize_booking_status_for_ui(booking.status),
                },
            },
            status=status.HTTP_200_OK,
        )


class UserNotificationsView(APIView):
    def post(self, request):
        email = clean_text(request.data.get('email')).lower()

        if not email:
            return Response(
                {'message': 'Не указан email'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notifications = UserNotification.objects.filter(email__iexact=email).order_by('-created_at')

        result = []
        for item in notifications:
            result.append({
                'id': item.id,
                'title': clean_text(item.title),
                'message': clean_text(item.message),
                'notification_type': clean_text(item.notification_type),
                'is_read': item.is_read,
                'created_at': safe_iso_datetime(item.created_at),
            })

        return Response(
            {
                'message': 'Уведомления получены',
                'notifications': result,
            },
            status=status.HTTP_200_OK,
        )


class MarkNotificationReadView(APIView):
    def post(self, request):
        serializer = NotificationReadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные уведомления', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notification = UserNotification.objects.filter(id=serializer.validated_data['notification_id']).first()

        if not notification:
            return Response(
                {'message': 'Уведомление не найдено'},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=['is_read'])

        return Response(
            {'message': 'Уведомление отмечено как прочитанное'},
            status=status.HTTP_200_OK,
        )


class PromotionTrackView(APIView):
    def post(self, request):
        serializer = PromotionTrackSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные акции', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        email = clean_text(data.get('email')).lower()
        user = None

        if data.get('user_id'):
            user = User.objects.filter(id=data['user_id']).first()
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        event = PromotionEvent.objects.create(
            user=user,
            email=email or (clean_text(user.email).lower() if user else ''),
            promo_code=clean_text(data['promo_code']),
            promo_title=clean_text(data.get('promo_title', '')),
            discount_label=clean_text(data.get('discount_label', '')),
            event_type=data['event_type'],
            page=clean_text(data.get('page', 'promotions')) or 'promotions',
        )

        return Response(
            {'message': 'Событие по акции сохранено', 'event_id': event.id},
            status=status.HTTP_201_CREATED,
        )