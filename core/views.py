from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone

from .models import Game, Review, Profile, UserGameList, Order, OrderItem, Post, Comment, Event, Survey, SurveyOption, \
    SurveyResponse
from .serializers import GameSerializer, ReviewSerializer, ProfileSerializer, UserGameListSerializer, OrderSerializer, \
    PostSerializer, CommentSerializer, EventSerializer, SurveySerializer, SurveyOptionSerializer


def get_user_role(user):
    if user.is_superuser: return 'ADMIN'
    try:
        return user.profile.role
    except:
        return 'GAMER'


@api_view(['GET', 'POST'])
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
            serializer.save(publisher=request.user, aprovado=(role == 'ADMIN'))
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
        data = request.data.copy()
        data['user'] = request.user.id
        data['game'] = game_id
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
    if User.objects.filter(username=username).exists(): return Response(status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, password=request.data.get('password'),
                                    email=request.data.get('email'))
    Profile.objects.create(user=user)
    return Response(status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    user = authenticate(request, username=request.data.get('username'), password=request.data.get('password'))
    if user:
        login(request, user)
        return Response({'message': 'Login com sucesso!'})
    return Response(status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout efetuado!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_view(request):
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


# --- EVENTOS ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_events(request):
    if get_user_role(request.user) != 'ADMIN': return Response(status=status.HTTP_403_FORBIDDEN)
    events = Event.objects.filter(aprovado=False).order_by('data_evento')
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
        data['criado_por'] = request.user.id
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


# --- INQUÉRITOS ---
@api_view(['GET', 'POST'])
def surveys(request):
    if request.method == 'GET':
        if request.user.is_authenticated and get_user_role(request.user) == 'ADMIN':
            data = Survey.objects.all().order_by('-data_criacao')
        else:
            data = Survey.objects.filter(ativo=True).order_by('-data_criacao')
        return Response(SurveySerializer(data, many=True, context={'request': request}).data)

    elif request.method == 'POST':
        if not request.user.is_authenticated or get_user_role(request.user) != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Agora passamos os dados diretamente sem o request.data.copy() manual
        serializer = SurveySerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save(criado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # A LINHA QUE FALTAVA PARA NÃO CRASHAR SILENCIOSAMENTE
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
        survey.ativo = not survey.ativo  # Toggle arquivar/desarquivar
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