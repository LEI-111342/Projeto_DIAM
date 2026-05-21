from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('api/games/', views.game_list, name='game_list'),
    path('api/games/<int:game_id>/', views.game_detail, name='game_detail'),
    path('api/games/<int:game_id>/approve/', views.approve_game, name='approve_game'),  # NOVO
    path('api/games/<int:game_id>/reviews/', views.game_reviews, name='game_reviews'),
    path('api/reviews/<int:review_id>/responder/', views.respond_to_review, name='respond_to_review'),

    path('api/signup/', views.signup, name='signup'),
    path('api/login/', views.login_view, name='login_view'),
    path('api/logout/', views.logout_view, name='logout_view'),
    path('api/user/', views.user_view, name='user_view'),
    path('api/profile/', views.profile_view, name='profile_view'),

    path('api/library/', views.user_library, name='user_library'),
    path('api/library/<int:item_id>/', views.user_library_detail, name='user_library_detail'),
    path('api/checkout/', views.checkout, name='checkout'),

    path('api/forum/', views.forum_post_list, name='forum_post_list'),
    path('api/forum/<int:post_id>/', views.forum_post_detail, name='forum_post_detail'),
    path('api/forum/<int:post_id>/comments/', views.forum_comments, name='forum_comments'),
    path('api/forum/comments/<int:comment_id>/', views.forum_comment_delete, name='forum_comment_delete'),
]