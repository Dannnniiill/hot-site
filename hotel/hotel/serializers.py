from django.contrib.auth.models import User
from rest_framework import serializers

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


class RequestSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    persons = serializers.IntegerField()
    type = serializers.CharField(required=False, allow_blank=True)


class RequestBronSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=256)
    last_name = serializers.CharField(max_length=256)
    phone_number = serializers.CharField(max_length=256)
    email = serializers.EmailField()
    comment = serializers.CharField(max_length=1024, required=False, allow_blank=True, default='')

    start_date = serializers.DateField()
    end_date = serializers.DateField()

    amount = serializers.IntegerField(max_value=4)
    type = serializers.CharField()
    nights = serializers.IntegerField()

    promo_code = serializers.CharField(required=False, allow_blank=True, default='')
    promo_discount = serializers.IntegerField(required=False, default=0)
    total_price = serializers.IntegerField(required=False, default=0)


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    email = serializers.EmailField()
    password = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, default='')


class VerifyRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=255)


class ProfileUpdateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32)


class CancelBookingSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    user_id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)


class NotificationReadSerializer(serializers.Serializer):
    notification_id = serializers.IntegerField()


class PromotionTrackSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    promo_code = serializers.CharField(max_length=64)
    promo_title = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    discount_label = serializers.CharField(max_length=32, required=False, allow_blank=True, default='')
    event_type = serializers.ChoiceField(choices=['copy', 'apply', 'details'])
    page = serializers.CharField(max_length=64, required=False, allow_blank=True, default='promotions')


class BookedSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingDate
        fields = "__all__"


class FeedBackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'


class StandardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Standard
        fields = '__all__'


class LuxePremiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = LuxePremium
        fields = '__all__'


class LuxeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Luxe
        fields = '__all__'


class LuxePlusSerializer(serializers.ModelSerializer):
    class Meta:
        model = LuxePlus
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    booked = BookedSerializer(many=True)

    class Meta:
        model = Room
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone',)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'profile', 'date_joined')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = '__all__'


class PromotionEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionEvent
        fields = '__all__'