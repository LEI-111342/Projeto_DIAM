from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('api/games/', views.game_list, name='game_list'),
    path('api/games/<int:game_id>/', views.game_detail, name='game_detail'),
    path('api/games/<int:game_id>/approve/', views.approve_game, name='approve_game'),
    path('api/games/<int:game_id>/reviews/', views.game_reviews, name='game_reviews'),
    path('api/reviews/<int:review_id>/responder/', views.respond_to_review, name='respond_to_review'),
    path('api/reviews/<int:review_id>/', views.review_detail, name='review_detail'),

    # Autenticação e Perfis
    path('api/signup/', views.signup, name='signup'),
    path('api/login/', views.login_view, name='login_view'),
    path('api/logout/', views.logout_view, name='logout_view'),
    path('api/user/', views.user_view, name='user_view'),
    path('api/profile/', views.profile_view, name='profile_view'),

    # Biblioteca e Encomendas
    path('api/library/', views.user_library, name='user_library'),
    path('api/library/<int:item_id>/', views.user_library_detail, name='user_library_detail'),
    path('api/checkout/', views.checkout, name='checkout'),

    # Fórum
    path('api/forum/', views.forum_post_list, name='forum_post_list'),
    path('api/forum/<int:post_id>/', views.forum_post_detail, name='forum_post_detail'),
    path('api/forum/<int:post_id>/comments/', views.forum_comments, name='forum_comments'),
    path('api/forum/comments/<int:comment_id>/', views.forum_comment_delete, name='forum_comment_delete'),

    # Eventos
    path('api/games/<int:game_id>/events/', views.game_events, name='game_events'),
    path('api/events/pending/', views.pending_events, name='pending_events'),
    path('api/events/upcoming/', views.upcoming_events, name='upcoming_events'),
    path('api/events/<int:event_id>/approve/', views.approve_event, name='approve_event'),
    path('api/events/<int:event_id>/', views.event_detail, name='event_detail'),

    # Inquéritos
    path('api/surveys/', views.surveys, name='surveys'),
    path('api/surveys/<int:survey_id>/', views.survey_detail, name='survey_detail'),
    path('api/surveys/<int:survey_id>/options/', views.survey_add_option, name='survey_add_option'),
    path('api/surveys/options/<int:option_id>/', views.survey_option_detail, name='survey_option_detail'),
    path('api/surveys/<int:survey_id>/respond/', views.survey_respond, name='survey_respond'),

    # Moderação Administrativa e Galeria
    path('api/publishers/', views.publisher_list, name='publisher_list'),
    path('api/publishers/quick-create/', views.quick_create_publisher, name='quick_create_publisher'),
    path('api/publishers/pending/', views.pending_publishers, name='pending_publishers'),
    path('api/publishers/<int:profile_id>/approve/', views.approve_publisher, name='approve_publisher'),
    path('api/games/<int:game_id>/gallery/', views.add_gallery_image, name='add_gallery_image'),
    path('api/gallery/<int:image_id>/', views.delete_gallery_image, name='delete_gallery_image'),

    # NOVAS ROTAS: Dashboard Admin Avançado para Empresas
    path('api/admin/publishers/all/', views.all_publishers_admin, name='all_publishers_admin'),
    path('api/admin/publishers/<int:user_id>/reset-password/', views.reset_publisher_password,
         name='reset_publisher_password'),
    path('api/admin/publishers/<int:user_id>/', views.admin_publisher_detail, name='admin_publisher_detail'),
    path('api/admin/publishers/<int:user_id>/assign-game/', views.admin_assign_game, name='admin_assign_game'),
    path('api/admin/games-light/', views.admin_games_light, name='admin_games_light'),
]