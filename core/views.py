from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

from .models import Game, Review, Profile, UserGameList, Order, OrderItem, Post, Comment
from .serializers import GameSerializer, ReviewSerializer, ProfileSerializer, UserGameListSerializer, OrderSerializer, \
    PostSerializer, CommentSerializer


def get_user_role(user):
    if user.is_superuser:
        return 'ADMIN'
    try:
        return user.profile.role
    except:
        return 'GAMER'


@api_view(['GET', 'POST'])
def game_list(request):
    if request.method == 'GET':
        # FILTRAGEM DE SEGURANÇA BASEADA NO CARGO
        if not request.user.is_authenticated:
            games = Game.objects.filter(aprovado=True).order_by('-id')
        else:
            role = get_user_role(request.user)
            if role == 'ADMIN':
                # Admin vê tudo
                games = Game.objects.all().order_by('-id')
            elif role == 'PUBLISHER':
                # Publisher só vê os seus próprios jogos (aprovados ou pendentes)
                games = Game.objects.filter(publisher=request.user).order_by('-id')
            else:
                # Gamers só veem os aprovados
                games = Game.objects.filter(aprovado=True).order_by('-id')

        serializer = GameSerializer(games, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        role = get_user_role(request.user)
        if role == 'GAMER':
            return Response({'msg': 'Acesso negado!'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            # Se for Admin que cria, aprova logo. Se for Publisher, fica pendente (aprovado=False)
            status_aprovacao = True if role == 'ADMIN' else False
            serializer.save(publisher=request.user, aprovado=status_aprovacao)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_game(request, game_id):
    if get_user_role(request.user) != 'ADMIN':
        return Response(status=status.HTTP_403_FORBIDDEN)

    try:
        game = Game.objects.get(id=game_id)
        game.aprovado = True
        game.save()
        return Response({'msg': 'Jogo aprovado com sucesso!'}, status=status.HTTP_200_OK)
    except Game.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT', 'DELETE'])
def game_detail(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GameSerializer(game)
        return Response(serializer.data)

    if request.method in ['PUT', 'DELETE']:
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        role = get_user_role(request.user)
        is_owner = (game.publisher == request.user)
        is_admin = (role == 'ADMIN')

        if not (is_admin or (role == 'PUBLISHER' and is_owner)):
            return Response(status=status.HTTP_403_FORBIDDEN)

        if request.method == 'PUT':
            serializer = GameSerializer(game, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            game.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
def game_reviews(request, game_id):
    if request.method == 'GET':
        reviews = Review.objects.filter(game_id=game_id).order_by('-data_submissao')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'msg': 'Tens de fazer login!'}, status=status.HTTP_401_UNAUTHORIZED)
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
    except Review.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    role = get_user_role(request.user)
    is_owner = (review.game.publisher == request.user)
    if not (role == 'ADMIN' or (role == 'PUBLISHER' and is_owner)):
        return Response(status=status.HTTP_403_FORBIDDEN)
    review.resposta_publisher = request.data.get('resposta_publisher', '')
    review.save()
    return Response(ReviewSerializer(review).data, status=status.HTTP_200_OK)


@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')  # NOVO: Puxa o email

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username já existe'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    Profile.objects.create(user=user)
    return Response({'message': 'Criado com sucesso!'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({'message': 'Login com sucesso!'})
    else:
        return Response({'error': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout efetuado!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_view(request):
    return Response({
        'username': request.user.username,
        'email': request.user.email,  # Devolve o email para usar no checkout!
        'role': get_user_role(request.user)
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def profile_view(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)
    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = ProfileSerializer(profile, data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'msg': 'profile updated'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_library(request):
    if request.method == 'GET':
        library = UserGameList.objects.filter(user=request.user).order_by('-data_adicao')
        serializer = UserGameListSerializer(library, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        game_id = request.data.get('game')
        if UserGameList.objects.filter(user=request.user, game_id=game_id).exists():
            return Response(status=status.HTTP_400_BAD_REQUEST)
        novo_registo = UserGameList.objects.create(user=request.user, game_id=game_id,
                                                   estado=request.data.get('estado', 'QUERO_JOGAR'))
        return Response(UserGameListSerializer(novo_registo).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_library_detail(request, item_id):
    try:
        item = UserGameList.objects.get(id=item_id, user=request.user)
    except UserGameList.DoesNotExist:
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
    if not game_ids:
        return Response({'msg': 'Carrinho vazio.'}, status=status.HTTP_400_BAD_REQUEST)
    order = Order.objects.create(user=request.user, total=0)
    total_pago = 0
    for g_id in game_ids:
        try:
            game = Game.objects.get(id=g_id)
            OrderItem.objects.create(order=order, game=game, preco_pago=game.preco)
            total_pago += game.preco
            if not UserGameList.objects.filter(user=request.user, game=game).exists():
                UserGameList.objects.create(user=request.user, game=game, estado='QUERO_JOGAR')
        except Game.DoesNotExist:
            continue
    order.total = total_pago
    order.save()
    return Response({'msg': 'Compra efetuada!'}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
def forum_post_list(request):
    if request.method == 'GET':
        posts = Post.objects.all().order_by('-data_criacao')
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        # BLOQUEIO DO PUBLISHER NO FÓRUM
        if get_user_role(request.user) == 'PUBLISHER':
            return Response({'msg': 'Publishers não participam no Fórum.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['autor'] = request.user.id
        serializer = PostSerializer(data=data)
        if serializer.is_valid():
            serializer.save(autor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
def forum_post_detail(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PostSerializer(post)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if request.user == post.autor or get_user_role(request.user) == 'ADMIN':
            post.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_403_FORBIDDEN)


@api_view(['GET', 'POST'])
def forum_comments(request, post_id):
    if request.method == 'GET':
        comments = Comment.objects.filter(post_id=post_id).order_by('data_criacao')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if get_user_role(request.user) == 'PUBLISHER':
            return Response(status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['post'] = post_id
        data['autor'] = request.user.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(autor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def forum_comment_delete(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.user == comment.autor or get_user_role(request.user) == 'ADMIN':
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_403_FORBIDDEN)