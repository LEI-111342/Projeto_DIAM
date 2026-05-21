from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Encaminha tudo o que for /core/ para a nossa App
    path('core/', include('core.urls')),


]

# Configuração que permite ao Django servir as imagens guardadas
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)