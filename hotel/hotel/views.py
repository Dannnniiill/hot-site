from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import transaction
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
    Standard,
    UserNotification,
    UserProfile,
)
from .serializers import (
    CancelBookingSerializer,
    FeedBackSerializer,
    LoginSerializer,
    NotificationReadSerializer,
    NotificationSerializer,
    ProfileUpdateSerializer,
    PromotionTrackSerializer,
    RegisterSerializer,
    RequestBronSerializer,
    RequestSerializer,
    VerifyRegisterSerializer,
)

DEMO_REGISTER_CODE = '123456'


def clean_text(value):
    if value is None:
        return ''

    value = str(value).strip()

    if value.lower() in ['', 'undefined', 'null', 'none']:
        return ''

    return value


def normalize_person_name(value):
    value = clean_text(value)
    return value


def normalize_room_type(room_type):
    value = str(room_type or '').strip().lower()

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


ROOM_TYPE_MAP = {
    'standard': Standard,
    'luxe': Luxe,
    'luxe plus': LuxePlus,
    'luxe premium': LuxePremium,
}


def generate_code():
    return DEMO_REGISTER_CODE


def send_code_email(email, code):
    return True


def send_booking_email(email, booking, action='created'):
    if action == 'created':
        subject = f'Бронирование {booking.booking_number} создано'
        message = (
            f'Ваше бронирование успешно создано.\n\n'
            f'Номер заявки: {booking.booking_number}\n'
            f'Тип номера: {booking.type}\n'
            f'Номер комнаты: {booking.number}\n'
            f'Заезд: {booking.start_date}\n'
            f'Выезд: {booking.end_date}\n'
            f'Гостей: {booking.amount}\n'
            f'Ночей: {booking.nights}\n'
            f'Стоимость: {booking.total_price} ₽\n'
            f'Статус: {booking.status}\n'
        )
    else:
        subject = f'Бронирование {booking.booking_number} отменено'
        message = (
            f'Ваше бронирование отменено.\n\n'
            f'Номер заявки: {booking.booking_number}\n'
            f'Тип номера: {booking.type}\n'
            f'Заезд: {booking.start_date}\n'
            f'Выезд: {booking.end_date}\n'
            f'Статус: {booking.status}\n'
        )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def create_notification(user, email, title, message, notification_type):
    return UserNotification.objects.create(
        user=user,
        email=email or '',
        title=title,
        message=message,
        notification_type=notification_type,
    )


def get_room_instance_by_type(room_type):
    normalized_type = normalize_room_type(room_type)
    model = ROOM_TYPE_MAP.get(normalized_type)

    if not model:
        return None, normalized_type

    return model.objects.first(), normalized_type


def get_free_rooms(instance, start_date, end_date):
    if not instance:
        return []

    free_rooms = []
    rooms = instance.rooms.all().order_by('number')

    for room in rooms:
        has_overlap = room.booked.filter(
            start_date__lt=end_date,
            end_date__gt=start_date,
            status__in=['new', 'confirmed'],
        ).exists()

        if not has_overlap:
            free_rooms.append(room)

    return free_rooms


def safe_iso_datetime(value):
    if not value:
        return ''
    try:
        return value.isoformat()
    except Exception:
        return str(value)


def normalize_booking_status_for_ui(raw_status):
    value = str(raw_status or '').strip().lower()

    if value in ['cancelled', 'canceled', 'cancel', 'отменена']:
        return 'Отменена'

    if value in ['confirmed', 'approved', 'accepted', 'подтверждена']:
        return 'Подтверждена'

    return 'Новая заявка'


class FeedBack(APIView):
    def post(self, request):
        serializer = FeedBackSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Обратная связь успешно отправлена',
                    'data': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'message': 'Ошибка при отправке обратной связи',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
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
        email = data['email'].strip().lower()

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

        EmailVerificationCode.objects.create(
            email=email,
            code=code,
            purpose='register',
            payload_name=clean_text(data['name']),
            payload_phone=clean_text(data.get('phone', '')),
            payload_password=data['password'],
        )

        return Response(
            {
                'message': f'Код подтверждения для демо: {code}',
                'demo_code': code,
            },
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

        email = serializer.validated_data['email'].strip().lower()
        code = serializer.validated_data['code'].strip()

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
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'phone': user.profile.phone,
                    'createdAt': user.date_joined,
                },
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

        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']

        user = User.objects.filter(email__iexact=email).first()

        if not user or not user.check_password(password):
            return Response(
                {'message': 'Неверный email или пароль'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone = getattr(user.profile, 'phone', '')

        return Response(
            {
                'message': 'Вход выполнен успешно',
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'phone': phone,
                    'createdAt': user.date_joined,
                },
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
            return Response({'message': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        another_user = User.objects.filter(email__iexact=data['email']).exclude(id=user.id).first()
        if another_user:
            return Response(
                {'message': 'Этот email уже используется другим пользователем'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.first_name = clean_text(data['name'])
        user.email = data['email'].strip().lower()
        user.username = data['email'].strip().lower()
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = clean_text(data['phone'])
        profile.save()

        return Response(
            {
                'message': 'Профиль обновлён',
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'phone': profile.phone,
                    'createdAt': user.date_joined,
                },
            },
            status=status.HTTP_200_OK,
        )


class ReturnFreeRooms(APIView):
    def post(self, request):
        serializer = RequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'message': 'Неверные данные для поиска номеров',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        persons = serializer.validated_data['persons']
        room_type = serializer.validated_data.get('type')

        if start_date >= end_date:
            return Response(
                {'message': 'Дата заезда должна быть раньше даты выезда'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = {
            'standard': 0,
            'luxe': 0,
            'luxe plus': 0,
            'luxe premium': 0,
        }

        type_keys = [normalize_room_type(room_type)] if room_type else list(ROOM_TYPE_MAP.keys())

        for type_key in type_keys:
            instance, normalized_type = get_room_instance_by_type(type_key)

            if not instance:
                continue

            if persons > instance.persons:
                continue

            free_rooms = get_free_rooms(instance, start_date, end_date)
            result[normalized_type] = len(free_rooms)

        return Response(result, status=status.HTTP_200_OK)


class Book(APIView):
    def post(self, request):
        serializer = RequestBronSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'message': 'Неверные данные для бронирования',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        start_date = data['start_date']
        end_date = data['end_date']
        amount = data['amount']
        email = data['email'].strip().lower()

        if start_date >= end_date:
            return Response(
                {'message': 'Дата заезда должна быть раньше даты выезда'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        room_instance, normalized_type = get_room_instance_by_type(data['type'])

        if not room_instance:
            return Response(
                {'message': 'Выбранный тип номера не найден'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if amount > room_instance.persons:
            return Response(
                {'message': 'Количество гостей превышает вместимость номера'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        free_rooms = get_free_rooms(room_instance, start_date, end_date)

        if not free_rooms:
            return Response(
                {'message': 'Свободных номеров на выбранные даты нет'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_room = free_rooms[0]
        free_rooms_numbers = ', '.join(str(room.number) for room in free_rooms)
        user = User.objects.filter(email__iexact=email).first()

        booking = BookingDate.objects.create(
            user=user,
            room=selected_room,
            first_name=normalize_person_name(data.get('first_name')),
            last_name=normalize_person_name(data.get('last_name')),
            phone_number=clean_text(data.get('phone_number')),
            email=email,
            comment=clean_text(data.get('comment', '')),
            amount=data['amount'],
            nights=data['nights'],
            price=room_instance.price,
            type=normalized_type,
            number=str(selected_room.number),
            free_rooms=free_rooms_numbers,
            start_date=start_date,
            end_date=end_date,
            promo_code=clean_text(data.get('promo_code', '')),
            promo_discount=data.get('promo_discount', 0),
            total_price=data.get('total_price', 0),
            status='new',
        )

        selected_room.booked.add(booking)

        create_notification(
            user=user,
            email=email,
            title='Бронирование создано',
            message=f'Заявка {booking.booking_number} успешно создана.',
            notification_type='booking_created',
        )

        try:
            send_booking_email(email, booking, action='created')
        except Exception:
            pass

        return Response(
            {
                'message': 'Бронирование успешно создано',
                'booking': {
                    'id': booking.id,
                    'booking_number': booking.booking_number,
                    'first_name': booking.first_name,
                    'last_name': booking.last_name,
                    'phone_number': booking.phone_number,
                    'email': booking.email,
                    'type': booking.type,
                    'number': booking.number,
                    'amount': booking.amount,
                    'nights': booking.nights,
                    'price': booking.price,
                    'promo_code': booking.promo_code,
                    'promo_discount': booking.promo_discount,
                    'total_price': booking.total_price,
                    'start_date': booking.start_date,
                    'end_date': booking.end_date,
                    'status': booking.status,
                    'created_at': safe_iso_datetime(booking.created_at),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MyBookingsView(APIView):
    def get(self, request):
        email = request.GET.get('email', '').strip().lower()

        if not email:
            return Response(
                {'message': 'Не указан email пользователя'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bookings = BookingDate.objects.filter(email__iexact=email).order_by('-id')

        data = []
        for booking in bookings:
            total_price = int(booking.total_price or 0)
            nights = int(booking.nights or 1)
            price_per_night = int(booking.price or 0)

            if not price_per_night and nights > 0 and total_price:
                price_per_night = round(total_price / nights)

            data.append(
                {
                    'id': booking.id,
                    'bookingNumber': booking.booking_number,
                    'first_name': clean_text(booking.first_name),
                    'last_name': clean_text(booking.last_name),
                    'phone_number': clean_text(booking.phone_number),
                    'email': clean_text(booking.email),
                    'type': clean_text(booking.type),
                    'roomName': clean_text(booking.type),
                    'number': clean_text(booking.number),
                    'amount': booking.amount,
                    'nights': nights,
                    'pricePerNight': price_per_night,
                    'promoCode': clean_text(booking.promo_code),
                    'promoDiscount': booking.promo_discount,
                    'totalPrice': total_price,
                    'comment': clean_text(booking.comment),
                    'start_date': str(booking.start_date or ''),
                    'end_date': str(booking.end_date or ''),
                    'status': normalize_booking_status_for_ui(booking.status),
                    'createdAt': safe_iso_datetime(booking.created_at),
                    'checkInTime': '14:00',
                    'checkOutTime': '12:00',
                }
            )

        return Response(data, status=status.HTTP_200_OK)


class CancelBookingView(APIView):
    def post(self, request):
        serializer = CancelBookingSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные для отмены', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        booking = BookingDate.objects.filter(id=data['booking_id']).first()

        if not booking:
            return Response({'message': 'Бронирование не найдено'}, status=status.HTTP_404_NOT_FOUND)

        if data.get('email') and booking.email.lower() != data['email'].strip().lower():
            return Response({'message': 'Нет доступа к этому бронированию'}, status=status.HTTP_403_FORBIDDEN)

        if str(booking.status).lower() in ['cancelled', 'canceled', 'cancel', 'отменена']:
            return Response({'message': 'Бронирование уже отменено'}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])

        create_notification(
            user=booking.user,
            email=booking.email,
            title='Бронирование отменено',
            message=f'Заявка {booking.booking_number} была отменена.',
            notification_type='booking_cancelled',
        )

        try:
            send_booking_email(booking.email, booking, action='cancelled')
        except Exception:
            pass

        return Response(
            {'message': 'Бронирование успешно отменено'},
            status=status.HTTP_200_OK,
        )


class NotificationsView(APIView):
    def get(self, request):
        email = request.GET.get('email', '').strip().lower()

        if not email:
            return Response(
                {'message': 'Не указан email пользователя'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notifications = UserNotification.objects.filter(email__iexact=email).order_by('-id')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationReadView(APIView):
    def post(self, request):
        serializer = NotificationReadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notification = UserNotification.objects.filter(id=serializer.validated_data['notification_id']).first()

        if not notification:
            return Response({'message': 'Уведомление не найдено'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save(update_fields=['is_read'])

        return Response({'message': 'Уведомление отмечено как прочитанное'}, status=status.HTTP_200_OK)


class PromotionTrackView(APIView):
    def post(self, request):
        serializer = PromotionTrackSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'message': 'Неверные данные по акции', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        email = str(data.get('email', '')).strip().lower()
        user = None

        if data.get('user_id'):
            user = User.objects.filter(id=data['user_id']).first()

        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        event = PromotionEvent.objects.create(
            user=user,
            email=email or (user.email if user else ''),
            promo_code=clean_text(data['promo_code']),
            promo_title=clean_text(data.get('promo_title', '')),
            discount_label=clean_text(data.get('discount_label', '')),
            event_type=data['event_type'],
            page=clean_text(data.get('page', 'promotions')) or 'promotions',
        )

        return Response(
            {
                'message': 'Событие по акции сохранено',
                'event_id': event.id,
            },
            status=status.HTTP_201_CREATED,
        )


class UserNotificationsView(NotificationsView):
    pass


class MarkNotificationReadView(NotificationReadView):
    pass