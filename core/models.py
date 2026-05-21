from django.db import models
from django.contrib.auth.models import User

ROLE_CHOICES = (
    ('GAMER', 'Gamer'),
    ('PUBLISHER', 'Publisher'),
    ('ADMIN', 'Admin'),
)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    imagem = models.ImageField(upload_to='profile_pics', default='default.png')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='GAMER')

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Game(models.Model):
    titulo = models.CharField(max_length=100)
    descricao = models.TextField()
    genero = models.CharField(max_length=50)
    preco = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    publisher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jogos_publicados', null=True,
                                  blank=True)

    # NOVO: Flag de aprovação (por defeito começa a Falso)
    aprovado = models.BooleanField(default=False)

    def __str__(self):
        return self.titulo


class Review(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    texto = models.TextField()
    data_submissao = models.DateTimeField(auto_now_add=True)
    resposta_publisher = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Review de {self.user.username} para {self.game.titulo}"


class UserGameList(models.Model):
    STATUS_CHOICES = (
        ('QUERO_JOGAR', 'Quero Jogar'),
        ('A_JOGAR', 'A Jogar'),
        ('CONCLUIDO', 'Concluído'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='biblioteca')
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='QUERO_JOGAR')
    data_adicao = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'game')

    def __str__(self):
        return f"{self.user.username} - {self.game.titulo} ({self.estado})"


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='encomendas')
    data_compra = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Encomenda #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='itens')
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    preco_pago = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.game.titulo} (Encomenda #{self.order.id})"


class Post(models.Model):
    titulo = models.CharField(max_length=200)
    conteudo = models.TextField()
    autor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comentarios')
    autor = models.ForeignKey(User, on_delete=models.CASCADE)
    conteudo = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comentário de {self.autor.username} no post {self.post.titulo}"