from django.contrib import admin
from .models import Profile, Game, Review, UserGameList, Order, OrderItem

# Registar os modelos no painel de admin do Django
admin.site.register(Profile)
admin.site.register(Game)
admin.site.register(Review)
admin.site.register(UserGameList)
admin.site.register(Order)
admin.site.register(OrderItem)