from rest_framework import serializers
from .models import Game, Review, Profile, UserGameList, Order, OrderItem, Post, Comment, Event, Survey, SurveyOption, SurveyResponse

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
        fields = ['id', 'rating', 'texto', 'data_submissao', 'user', 'game', 'nome_utilizador', 'resposta_publisher', 'user_imagem']
    def get_user_imagem(self, obj):
        try: return obj.user.profile.imagem.url
        except: return '/media/default.png'

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
        try: return obj.autor.profile.imagem.url
        except: return '/media/default.png'

class PostSerializer(serializers.ModelSerializer):
    autor_nome = serializers.ReadOnlyField(source='autor.username')
    autor_imagem = serializers.SerializerMethodField()
    numero_comentarios = serializers.SerializerMethodField()
    class Meta:
        model = Post
        fields = ['id', 'titulo', 'conteudo', 'autor', 'autor_nome', 'data_criacao', 'numero_comentarios', 'autor_imagem']
    def get_numero_comentarios(self, obj):
        return obj.comentarios.count()
    def get_autor_imagem(self, obj):
        try: return obj.autor.profile.imagem.url
        except: return '/media/default.png'

class EventSerializer(serializers.ModelSerializer):
    game_titulo = serializers.ReadOnlyField(source='game.titulo')
    class Meta:
        model = Event
        fields = ['id', 'game', 'game_titulo', 'titulo', 'descricao', 'data_evento', 'criado_por', 'aprovado']


class SurveyOptionSerializer(serializers.ModelSerializer):
    votos_count = serializers.SerializerMethodField()

    class Meta:
        model = SurveyOption
        fields = ['id', 'survey', 'texto', 'votos_count']

    def get_votos_count(self, obj):
        # Agora o Django já sabe que obj.responses são os SurveyResponse ligados a esta opção
        return obj.responses.count()

class SurveyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyResponse
        fields = '__all__'


class SurveySerializer(serializers.ModelSerializer):
    options = SurveyOptionSerializer(many=True, read_only=True)
    user_voto = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = ['id', 'titulo', 'descricao', 'criado_por', 'data_criacao', 'ativo', 'options', 'user_voto']
        read_only_fields = ['criado_por']  # <--- ADICIONAR ESTA LINHA AQUI

    def get_user_voto(self, obj):
        request = self.context.get('request')
        # Apenas Gamers podem ter votos registados. Admins não votam.
        if request and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'GAMER':
            try:
                voto = SurveyResponse.objects.get(survey=obj, user=request.user)
                return voto.option.id
            except SurveyResponse.DoesNotExist:
                return None
        return None