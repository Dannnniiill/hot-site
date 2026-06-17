from django.contrib import admin

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


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'phone_number', 'status')
    list_filter = ('status',)
    search_fields = ('first_name', 'last_name', 'phone_number')
    ordering = ('-id',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone')
    search_fields = ('user__email', 'user__first_name', 'phone')
    ordering = ('-id',)


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'code', 'purpose', 'is_used', 'created_at', 'expires_at')
    list_filter = ('purpose', 'is_used', 'created_at')
    search_fields = ('email', 'code')
    ordering = ('-created_at',)


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'email', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'email', 'user__email')
    ordering = ('-created_at',)


@admin.register(PromotionEvent)
class PromotionEventAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'promo_code',
        'promo_title',
        'event_type',
        'email',
        'user',
        'discount_label',
        'page',
        'created_at',
    )
    list_filter = ('event_type', 'promo_code', 'created_at', 'page')
    search_fields = ('promo_code', 'promo_title', 'email', 'user__email')
    ordering = ('-created_at',)


@admin.register(BookingDate)
class BookingDateAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'booking_number',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'type',
        'number',
        'amount',
        'nights',
        'promo_code',
        'promo_discount',
        'total_price',
        'status',
        'start_date',
        'end_date',
        'created_at',
    )
    list_filter = ('status', 'type', 'start_date', 'end_date', 'created_at')
    search_fields = (
        'booking_number',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'promo_code',
        'number',
    )
    ordering = ('-created_at',)
    readonly_fields = ('booking_number', 'created_at', 'updated_at')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'number')
    search_fields = ('number',)
    ordering = ('number',)


@admin.register(Standard)
class StandardAdmin(admin.ModelAdmin):
    list_display = ('id', 'price', 'persons')
    filter_horizontal = ('rooms',)


@admin.register(Luxe)
class LuxeAdmin(admin.ModelAdmin):
    list_display = ('id', 'price', 'persons')
    filter_horizontal = ('rooms',)


@admin.register(LuxePlus)
class LuxePlusAdmin(admin.ModelAdmin):
    list_display = ('id', 'price', 'persons')
    filter_horizontal = ('rooms',)


@admin.register(LuxePremium)
class LuxePremiumAdmin(admin.ModelAdmin):
    list_display = ('id', 'price', 'persons')
    filter_horizontal = ('rooms',)