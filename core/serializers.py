from rest_framework import serializers
from .models import Game, Review, Profile, UserGameList, Order, OrderItem, Post, Comment


class GameSerializer(serializers.ModelSerializer):
    publisher_nome = serializers.ReadOnlyField(source='publisher.username')

    class Meta:
        model = Game
        fields = ['id', 'titulo', 'descricao', 'genero', 'preco', 'publisher', 'publisher_nome', 'aprovado']


class ReviewSerializer(serializers.ModelSerializer):
    nome_utilizador = serializers.ReadOnlyField(source='user.username')
    user_imagem = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'rating', 'texto', 'data_submissao', 'user', 'game', 'nome_utilizador', 'resposta_publisher',
                  'user_imagem']

    def get_user_imagem(self, obj):
        try:
            return obj.user.profile.imagem.url
        except:
            return '/media/default.png'


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'user', 'imagem', 'role')


class UserGameListSerializer(serializers.ModelSerializer):
    titulo_jogo = serializers.ReadOnlyField(source='game.titulo')

    class Meta:
        model = UserGameList
        fields = ['id', 'user', 'game', 'titulo_jogo', 'estado', 'data_adicao']


class OrderItemSerializer(serializers.ModelSerializer):
    titulo_jogo = serializers.ReadOnlyField(source='game.titulo')

    class Meta:
        model = OrderItem
        fields = ['id', 'game', 'titulo_jogo', 'preco_pago']


class OrderSerializer(serializers.ModelSerializer):
    itens = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'data_compra', 'total', 'itens']


class CommentSerializer(serializers.ModelSerializer):
    autor_nome = serializers.ReadOnlyField(source='autor.username')
    autor_imagem = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'autor', 'autor_nome', 'conteudo', 'data_criacao', 'autor_imagem']

    def get_autor_imagem(self, obj):
        try:
            return obj.autor.profile.imagem.url
        except:
            return '/media/default.png'


class PostSerializer(serializers.ModelSerializer):
    autor_nome = serializers.ReadOnlyField(source='autor.username')
    autor_imagem = serializers.SerializerMethodField()
    numero_comentarios = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'titulo', 'conteudo', 'autor', 'autor_nome', 'data_criacao', 'numero_comentarios',
                  'autor_imagem']

    def get_numero_comentarios(self, obj):
        return obj.comentarios.count()

    def get_autor_imagem(self, obj):
        try:
            return obj.autor.profile.imagem.url
        except:
            return '/media/default.png'