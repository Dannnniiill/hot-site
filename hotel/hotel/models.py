from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Feedback(models.Model):
    first_name = models.CharField(max_length=512)
    last_name = models.CharField(max_length=512)
    phone_number = models.CharField(max_length=32)
    status = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} {self.phone_number} {self.status}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=32, blank=True, default='')

    def __str__(self):
        return f"{self.user.email} | {self.phone}"


class EmailVerificationCode(models.Model):
    PURPOSE_CHOICES = (
        ('register', 'Регистрация'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='verification_codes',
        null=True,
        blank=True,
    )

    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES, default='register')

    payload_name = models.CharField(max_length=255, blank=True, default='')
    payload_phone = models.CharField(max_length=32, blank=True, default='')
    payload_password = models.CharField(max_length=255, blank=True, default='')

    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.email} | {self.code} | {self.purpose}"


class UserNotification(models.Model):
    NOTIFICATION_TYPES = (
        ('auth', 'Авторизация'),
        ('booking_created', 'Бронирование создано'),
        ('booking_cancelled', 'Бронирование отменено'),
        ('booking_updated', 'Бронирование обновлено'),
        ('system', 'Системное'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    email = models.EmailField(blank=True, default='')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=32, choices=NOTIFICATION_TYPES, default='system')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.email or self.user_id} | {self.title}"


class PromotionEvent(models.Model):
    EVENT_TYPES = (
        ('copy', 'Копирование промокода'),
        ('apply', 'Применение акции'),
        ('details', 'Открытие подробностей'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='promotion_events',
        null=True,
        blank=True,
    )
    email = models.EmailField(blank=True, default='', db_index=True)
    promo_code = models.CharField(max_length=64, db_index=True)
    promo_title = models.CharField(max_length=255, blank=True, default='')
    discount_label = models.CharField(max_length=32, blank=True, default='')
    event_type = models.CharField(max_length=32, choices=EVENT_TYPES, db_index=True)
    page = models.CharField(max_length=64, blank=True, default='promotions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.promo_code} | {self.event_type} | {self.email or self.user_id}"


class BookingDate(models.Model):
    STATUS_CHOICES = (
        ('new', 'Новая'),
        ('confirmed', 'Подтверждена'),
        ('cancelled', 'Отменена'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='bookings',
        null=True,
        blank=True,
    )

    room = models.ForeignKey(
        'Room',
        on_delete=models.SET_NULL,
        related_name='booking_records',
        null=True,
        blank=True,
    )

    first_name = models.CharField(max_length=512, null=True, blank=True)
    last_name = models.CharField(max_length=512, null=True, blank=True)
    phone_number = models.CharField(max_length=32, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)

    comment = models.CharField(max_length=512, null=True, blank=True)
    amount = models.IntegerField(default=1)
    nights = models.IntegerField(default=1)
    price = models.IntegerField(default=0)

    type = models.CharField(max_length=512, null=True, blank=True)
    number = models.CharField(max_length=32, null=True, blank=True)
    free_rooms = models.CharField(max_length=512, null=True, blank=True)

    promo_code = models.CharField(max_length=64, null=True, blank=True)
    promo_discount = models.IntegerField(default=0)
    total_price = models.IntegerField(default=0)

    booking_number = models.CharField(max_length=32, unique=True, null=True, blank=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='new')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = max((self.price * self.nights) - self.promo_discount, 0)

        super().save(*args, **kwargs)

        if not self.booking_number:
            self.booking_number = f"HTL-{str(self.id).zfill(6)}"
            super().save(update_fields=['booking_number'])

    def __str__(self):
        return (
            f"{self.booking_number or self.id} | "
            f"{self.first_name} {self.last_name} | "
            f"{self.start_date} - {self.end_date} | {self.status}"
        )


class Room(models.Model):
    number = models.IntegerField(unique=True)
    booked = models.ManyToManyField(
        BookingDate,
        blank=True,
        related_name='legacy_booked_rooms'
    )

    def __str__(self):
        return f"{self.number}"


class Standard(models.Model):
    rooms = models.ManyToManyField(Room)
    price = models.IntegerField(default=2200)
    persons = models.IntegerField(default=2)

    def __str__(self):
        return f"Standard - {self.price}"


class Luxe(models.Model):
    rooms = models.ManyToManyField(Room)
    price = models.IntegerField(default=3400)
    persons = models.IntegerField(default=3)

    def __str__(self):
        return f"Luxe - {self.price}"


class LuxePlus(models.Model):
    rooms = models.ManyToManyField(Room)
    price = models.IntegerField(default=3700)
    persons = models.IntegerField(default=3)

    def __str__(self):
        return f"LuxePlus - {self.price}"


class LuxePremium(models.Model):
    rooms = models.ManyToManyField(Room)
    price = models.IntegerField(default=4200)
    persons = models.IntegerField(default=4)

    def __str__(self):
        return f"LuxePremium - {self.price}"