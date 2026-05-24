from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone

from .models import Game, GameImage, Review, Profile, UserGameList, Order, OrderItem, Post, Comment, Event, Survey, \
    SurveyOption, SurveyResponse
from .serializers import GameSerializer, ReviewSerializer, ProfileSerializer, UserGameListSerializer, OrderSerializer, \
    PostSerializer, CommentSerializer, EventSerializer, SurveySerializer, SurveyOptionSerializer


def get_user_role(user):
    if user.is_superuser: return 'ADMIN'
    try:
        return user.profile.role
    except:
        return 'GAMER'


@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def game_list(request):
    if request.method == 'GET':
        if not request.user.is_authenticated:
            games = Game.objects.filter(aprovado=True).order_by('-id')
        else:
            role = get_user_role(request.user)
            if role == 'ADMIN':
                games = Game.objects.all().order_by('-id')
            elif role == 'PUBLISHER':
                games = Game.objects.filter(publisher=request.user).order_by('-id')
            else:
                games = Game.objects.filter(aprovado=True).order_by('-id')
        return Response(GameSerializer(games, many=True).data)

    elif request.method == 'POST':
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        role = get_user_role(request.user)
        if role == 'GAMER': return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            if role == 'ADMIN':
                pub_id = request.data.get('publisher_id')
                try:
                    publisher_escolhida = User.objects.get(id=pub_id, profile__role='PUBLISHER')
                except:
                    publisher_escolhida = request.user
            else:
                publisher_escolhida = request.user

            serializer.save(
                publisher=publisher_escolhida,
                aprovado=(role == 'ADMIN'),
                imagem_principal=request.FILES.get('imagem_principal', 'game_defaults/cover.png')
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_game(request, game_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        game = Game.objects.get(id=game_id)
        game.aprovado = True
        game.save()
        return Response({'msg': 'Aprovado!'})
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def game_detail(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET': return Response(GameSerializer(game).data)
    if request.method in ['PUT', 'DELETE']:
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        role = get_user_role(request.user)
        if not (role == 'ADMIN' or (role == 'PUBLISHER' and game.publisher == request.user)): return Response(
            status=status.HTTP_403_FORBIDDEN)
        if request.method == 'PUT':
            serializer = GameSerializer(game, data=request.data, partial=True)
            if serializer.is_valid():
                if 'imagem_principal' in request.FILES:
                    serializer.save(imagem_principal=request.FILES['imagem_principal'])
                else:
                    serializer.save()
                return Response(serializer.data)
        elif request.method == 'DELETE':
            game.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
def game_reviews(request, game_id):
    if request.method == 'GET':
        reviews = Review.objects.filter(game_id=game_id).order_by('-data_submissao')
        return Response(ReviewSerializer(reviews, many=True).data)
    elif request.method == 'POST':
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        if Review.objects.filter(user=request.user, game_id=game_id).exists():
            return Response({'error': 'Já avaliaste este jogo.'}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['user'] = request.user.id
        data['game'] = game_id

        rating = int(data.get('rating', 10))
        ugl, _ = UserGameList.objects.get_or_create(user=request.user, game_id=game_id)
        ugl.nota = rating
        ugl.save()

        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    role = get_user_role(request.user)
    if request.user != review.user and role != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    if request.method == 'DELETE':
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    elif request.method == 'PUT':
        if request.user != review.user: return Response(status=status.HTTP_403_FORBIDDEN)
        novo_rating = int(request.data.get('rating', review.rating))
        review.rating = novo_rating
        review.texto = request.data.get('texto', review.texto)
        review.save()
        try:
            ugl = UserGameList.objects.get(user=request.user, game=review.game)
            ugl.nota = novo_rating
            ugl.save()
        except:
            pass
        return Response(ReviewSerializer(review).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def respond_to_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    role = get_user_role(request.user)
    if not (role == 'ADMIN' or (role == 'PUBLISHER' and review.game.publisher == request.user)): return Response(
        status=status.HTTP_403_FORBIDDEN)
    review.resposta_publisher = request.data.get('resposta_publisher', '')
    review.save()
    return Response(ReviewSerializer(review).data)


@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    role = request.data.get('role', 'GAMER')
    nome_empresa = request.data.get('nome_empresa', None)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username indisponível'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=request.data.get('password'),
                                    email=request.data.get('email'))

    # Travão de aprovação: Começa falso se for empresa (Publisher)
    status_aprovacao = False if role == 'PUBLISHER' else True
    Profile.objects.create(user=user, role=role, nome_empresa=nome_empresa, aprovado=status_aprovacao)
    return Response(status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    user = authenticate(request, username=request.data.get('username'), password=request.data.get('password'))
    if user:
        # Validar se a conta comercial está autorizada pelo Administrador
        if hasattr(user, 'profile') and not user.profile.aprovado:
            return Response({'error': 'A tua conta de Publisher ainda aguarda aprovação do Admin.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        login(request, user)
        return Response({'message': 'Login efetuado'})
    return Response(status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout efetuado!'})


@api_view(['GET'])
def user_view(request):
    if not request.user.is_authenticated: return Response({'role': None})
    return Response(
        {'username': request.user.username, 'email': request.user.email, 'role': get_user_role(request.user)})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def profile_view(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        return Response(ProfileSerializer(profile).data)
    elif request.method == 'PUT':
        serializer = ProfileSerializer(profile, data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_library(request):
    if request.method == 'GET':
        library = UserGameList.objects.filter(user=request.user).order_by('-data_adicao')
        return Response(UserGameListSerializer(library, many=True).data)
    elif request.method == 'POST':
        game_id = request.data.get('game')
        if UserGameList.objects.filter(user=request.user, game_id=game_id).exists(): return Response(
            status=status.HTTP_400_BAD_REQUEST)
        novo_registo = UserGameList.objects.create(user=request.user, game_id=game_id,
                                                   estado=request.data.get('estado', 'QUERO_JOGAR'))
        return Response(UserGameListSerializer(novo_registo).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_library_detail(request, item_id):
    try:
        item = UserGameList.objects.get(id=item_id, user=request.user)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'PUT':
        item.estado = request.data.get('estado', item.estado)
        if 'nota' in request.data:
            val = request.data['nota']
            if val == '' or val is None:
                item.nota = None
            else:
                try:
                    item.nota = int(val)
                    try:
                        rev = Review.objects.get(user=request.user, game=item.game)
                        rev.rating = item.nota
                        rev.save()
                    except:
                        pass
                except:
                    pass
        item.save()
        return Response(UserGameListSerializer(item).data)
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    game_ids = request.data.get('jogos', [])
    if not game_ids: return Response(status=status.HTTP_400_BAD_REQUEST)
    order = Order.objects.create(user=request.user, total=0)
    total_pago = 0
    for g_id in game_ids:
        try:
            game = Game.objects.get(id=g_id)
            OrderItem.objects.create(order=order, game=game, preco_pago=game.preco)
            total_pago += game.preco
            if not UserGameList.objects.filter(user=request.user, game=game).exists():
                UserGameList.objects.create(user=request.user, game=game, estado='QUERO_JOGAR')
        except:
            continue
    order.total = total_pago
    order.save()
    return Response({'msg': 'Compra efetuada!'}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
def forum_post_list(request):
    if request.method == 'GET':
        posts = Post.objects.all().order_by('-data_criacao')
        return Response(PostSerializer(posts, many=True).data)
    elif request.method == 'POST':
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        if get_user_role(request.user) == 'PUBLISHER': return Response(status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['autor'] = request.user.id
        serializer = PostSerializer(data=data)
        if serializer.is_valid():
            serializer.save(autor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE'])
def forum_post_detail(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(PostSerializer(post).data)
    elif request.method == 'DELETE':
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        if request.user == post.autor or get_user_role(request.user) == 'ADMIN':
            post.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_403_FORBIDDEN)


@api_view(['GET', 'POST'])
def forum_comments(request, post_id):
    if request.method == 'GET':
        comments = Comment.objects.filter(post_id=post_id).order_by('data_criacao')
        return Response(CommentSerializer(comments, many=True).data)
    elif request.method == 'POST':
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        if get_user_role(request.user) == 'PUBLISHER': return Response(status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['post'] = post_id
        data['autor'] = request.user.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(autor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def forum_comment_delete(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.user == comment.autor or get_user_role(request.user) == 'ADMIN':
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_403_FORBIDDEN)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_events(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    events = Event.objects.filter(aprovado=False).order_by('data_evento')
    return Response(EventSerializer(events, many=True).data)


@api_view(['GET'])
def upcoming_events(request):
    # Lista global cronológica de eventos aprovados para a página inicial
    events = Event.objects.filter(aprovado=True, data_evento__gte=timezone.now()).order_by('data_evento')[:6]
    return Response(EventSerializer(events, many=True).data)


@api_view(['GET', 'POST'])
def game_events(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        if not request.user.is_authenticated:
            events = Event.objects.filter(game=game, aprovado=True, data_evento__gte=timezone.now()).order_by(
                'data_evento')
        else:
            role = get_user_role(request.user)
            if role == 'ADMIN' or (role == 'PUBLISHER' and game.publisher == request.user):
                events = Event.objects.filter(game=game).order_by('data_evento')
            else:
                events = Event.objects.filter(game=game, aprovado=True, data_evento__gte=timezone.now()).order_by(
                    'data_evento')
        return Response(EventSerializer(events, many=True).data)
    elif request.method == 'POST':
        if not request.user.is_authenticated: return Response(status=status.HTTP_401_UNAUTHORIZED)
        role = get_user_role(request.user)
        if role == 'GAMER' or (role == 'PUBLISHER' and game.publisher != request.user): return Response(
            status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['game'] = game.id
        data['criated_por'] = request.user.id
        serializer = EventSerializer(data=data)
        if serializer.is_valid():
            serializer.save(game=game, criado_por=request.user, aprovado=(role == 'ADMIN'))
            return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_event(request, event_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        ev = Event.objects.get(id=event_id)
        ev.aprovado = True
        ev.save()
        return Response(status=status.HTTP_200_OK)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def event_detail(request, event_id):
    try:
        ev = Event.objects.get(id=event_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    role = get_user_role(request.user)
    if role == 'ADMIN' or (role == 'PUBLISHER' and ev.game.publisher == request.user):
        ev.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_403_FORBIDDEN)


@api_view(['GET', 'POST'])
def surveys(request):
    if request.method == 'GET':
        if request.user.is_authenticated and get_user_role(request.user) == 'ADMIN':
            data = Survey.objects.all().order_by('-data_criacao')
        else:
            data = Survey.objects.filter(ativo=True).order_by('-data_criacao')
        return Response(SurveySerializer(data, many=True, context={'request': request}).data)
    elif request.method == 'POST':
        if not request.user.is_authenticated or get_user_role(request.user) != 'ADMIN': return Response(
            status=status.HTTP_403_FORBIDDEN)
        serializer = SurveySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(criado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def survey_detail(request, survey_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        survey = Survey.objects.get(id=survey_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'PUT':
        survey.ativo = not survey.ativo
        survey.save()
        return Response(SurveySerializer(survey, context={'request': request}).data)
    elif request.method == 'DELETE':
        survey.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def survey_add_option(request, survey_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        survey = Survey.objects.get(id=survey_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    SurveyOption.objects.create(survey=survey, texto=request.data.get('texto'))
    return Response(status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def survey_option_detail(request, option_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        opt = SurveyOption.objects.get(id=option_id)
        opt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def survey_respond(request, survey_id):
    if get_user_role(request.user) != 'GAMER': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        survey = Survey.objects.get(id=survey_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    try:
        option = SurveyOption.objects.get(id=request.data.get('option'), survey=survey)
    except:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    response, created = SurveyResponse.objects.get_or_create(survey=survey, user=request.user,
                                                             defaults={'option': option})
    if not created:
        response.option = option
        response.save()
    return Response({'msg': 'Resposta registada'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def publisher_list(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    publishers = User.objects.filter(profile__role='PUBLISHER', profile__aprovado=True)
    dados = [{'id': p.id, 'username': p.username, 'nome_empresa': p.profile.nome_empresa} for p in publishers]
    return Response(dados)


# PROCESSAMENTO REQUISITADO: Admin cria uma nova empresa instantaneamente no dropdown
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quick_create_publisher(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    username = request.data.get('username').strip().lower().replace(" ", "_")
    nome_empresa = request.data.get('nome_empresa').strip()

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Esse identificador já existe.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password='PlaySphere2026!', email=f"{username}@playsphere.pt")
    Profile.objects.create(user=user, role='PUBLISHER', nome_empresa=nome_empresa, aprovado=True)
    return Response({'id': user.id, 'username': user.username, 'nome_empresa': nome_empresa},
                    status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_publishers(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    profiles = Profile.objects.filter(role='PUBLISHER', aprovado=False)
    dados = [{'id': p.id, 'username': p.user.username, 'nome_empresa': p.nome_empresa, 'email': p.user.email} for p in
             profiles]
    return Response(dados)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_publisher(request, profile_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        p = Profile.objects.get(id=profile_id)
        p.aprovado = True
        p.save()
        return Response(status=status.HTTP_200_OK)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)


# GESTÃO DE IMAGENS MULTIMÉDIA (Aulas Práticas de Uploads de Ficheiros)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def add_gallery_image(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    role = get_user_role(request.user)
    if not (role == 'ADMIN' or (role == 'PUBLISHER' and game.publisher == request.user)):
        return Response(status=status.HTTP_403_FORBIDDEN)
    if 'imagem' not in request.FILES:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    img = GameImage.objects.create(game=game, imagem=request.FILES['imagem'])
    return Response({'id': img.id, 'imagem': img.imagem.url}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_gallery_image(request, image_id):
    try:
        img = GameImage.objects.get(id=image_id)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    role = get_user_role(request.user)
    if not (role == 'ADMIN' or (role == 'PUBLISHER' and img.game.publisher == request.user)):
        return Response(status=status.HTTP_403_FORBIDDEN)
    img.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_publishers_admin(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    pubs = Profile.objects.filter(role='PUBLISHER')
    dados = [{
        'id': p.id,
        'user_id': p.user.id,
        'username': p.user.username,
        'nome_empresa': p.nome_empresa,
        'aprovado': p.aprovado,
        'email': p.user.email
    } for p in pubs]
    return Response(dados)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_publisher_password(request, user_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=user_id, profile__role='PUBLISHER')
        user.set_password('PlaySphere2026!')
        user.save()
        return Response({'msg': 'Password reposta para PlaySphere2026!'})
    except: return Response(status=status.HTTP_404_NOT_FOUND)


# ==========================================
# GESTÃO AVANÇADA DE EMPRESAS (ADMIN)
# ==========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_publishers_admin(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    pubs = Profile.objects.filter(role='PUBLISHER')
    dados = [{
        'id': p.id,
        'user_id': p.user.id,
        'username': p.user.username,
        'nome_empresa': p.nome_empresa,
        'aprovado': p.aprovado,
        'email': p.user.email
    } for p in pubs]
    return Response(dados)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_publisher_password(request, user_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=user_id, profile__role='PUBLISHER')
        user.set_password('PlaySphere2026!')
        user.save()
        return Response({'msg': 'Password reposta para PlaySphere2026!'})
    except: return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def admin_publisher_detail(request, user_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    try: user = User.objects.get(id=user_id, profile__role='PUBLISHER')
    except: return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        jogos = Game.objects.filter(publisher=user).order_by('-id')
        jogos_data = [{'id': g.id, 'titulo': g.titulo, 'aprovado': g.aprovado} for g in jogos]
        return Response({
            'user_id': user.id,
            'username': user.username,
            'nome_empresa': user.profile.nome_empresa,
            'email': user.email,
            'jogos': jogos_data
        })
    elif request.method == 'PUT':
        user.profile.nome_empresa = request.data.get('nome_empresa', user.profile.nome_empresa)
        user.profile.save()
        return Response({'msg': 'Dados atualizados com sucesso'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_games_light(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    games = Game.objects.all().order_by('-id')
    # Traz a lista simples de jogos para o Admin poder escolher qual associar à empresa
    dados = [{'id': g.id, 'titulo': g.titulo, 'publisher_id': g.publisher.id if g.publisher else None, 'publisher_nome': g.publisher.username if g.publisher else 'Sem Empresa'} for g in games]
    return Response(dados)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_assign_game(request, user_id):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    game_id = request.data.get('game_id')
    try:
        game = Game.objects.get(id=game_id)
        user = User.objects.get(id=user_id, profile__role='PUBLISHER')
        game.publisher = user
        game.save()
        return Response({'msg': 'Jogo associado com sucesso à empresa!'})
    except: return Response(status=status.HTTP_404_NOT_FOUND)