from django.contrib import admin
from django.urls import path

from hotel import views
from hotel.analytics_views import (
    AnalyticsDashboardView,
    AnalyticsBookingsView,
    AnalyticsExportExcelView,
    AnalyticsExportPdfView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('feedback/', views.FeedBack.as_view()),
    path('rooms/', views.ReturnFreeRooms.as_view()),
    path('book/', views.Book.as_view()),

    path('auth/register/', views.RegisterRequestView.as_view()),
    path('auth/register/verify/', views.RegisterVerifyView.as_view()),
    path('auth/login/', views.LoginView.as_view()),
    path('auth/profile/update/', views.ProfileUpdateView.as_view()),

    path('bookings/my/', views.MyBookingsView.as_view()),
    path('bookings/cancel/', views.CancelBookingView.as_view()),

    path('notifications/', views.UserNotificationsView.as_view()),
    path('notifications/read/', views.MarkNotificationReadView.as_view()),

    path('promotions/track/', views.PromotionTrackView.as_view()),

    path('analytics/dashboard/', AnalyticsDashboardView.as_view()),
    path('analytics/bookings/', AnalyticsBookingsView.as_view()),
    path('analytics/export/excel/', AnalyticsExportExcelView.as_view()),
    path('analytics/export/pdf/', AnalyticsExportPdfView.as_view()),
]