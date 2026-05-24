from rest_framework import serializers
from .models import Game, GameImage, Review, Profile, UserGameList, Order, OrderItem, Post, Comment, Event, Survey, \
    SurveyOption, SurveyResponse


class GameImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameImage
        fields = ['id', 'imagem']


class GameSerializer(serializers.ModelSerializer):
    publisher_nome = serializers.SerializerMethodField()
    publisher_username = serializers.ReadOnlyField(source='publisher.username')  # <--- NOVO CAMPO PARA LÓGICA
    numero_reviews = serializers.SerializerMethodField()
    rating_medio = serializers.SerializerMethodField()
    galeria = GameImageSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['id', 'titulo', 'descricao', 'genero', 'preco', 'publisher', 'publisher_username', 'publisher_nome',
                  'aprovado', 'numero_reviews', 'rating_medio', 'imagem_principal', 'galeria']

    def get_publisher_nome(self, obj):
        if obj.publisher and hasattr(obj.publisher, 'profile') and obj.publisher.profile.nome_empresa:
            return obj.publisher.profile.nome_empresa
        return obj.publisher.username if obj.publisher else "PlaySphere"

    def get_numero_reviews(self, obj):
        from .models import UserGameList
        return UserGameList.objects.filter(game=obj, nota__isnull=False).count()

    def get_rating_medio(self, obj):
        from .models import UserGameList
        notas = UserGameList.objects.filter(game=obj, nota__isnull=False)
        if notas.exists():
            return sum(n.nota for n in notas) / notas.count()
        return 0


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
        fields = ('id', 'user', 'imagem', 'role', 'nome_empresa', 'aprovado')


class UserGameListSerializer(serializers.ModelSerializer):
    titulo_jogo = serializers.ReadOnlyField(source='game.titulo')

    class Meta:
        model = UserGameList
        fields = ['id', 'user', 'game', 'titulo_jogo', 'estado', 'nota', 'data_adicao']


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
        read_only_fields = ['criado_por']

    def get_user_voto(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user,
                                                                 'profile') and request.user.profile.role == 'GAMER':
            try:
                voto = SurveyResponse.objects.get(survey=obj, user=request.user)
                return voto.option.id
            except SurveyResponse.DoesNotExist:
                return None
        return None