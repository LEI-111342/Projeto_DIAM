import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useUserContext } from './UserProvider'; // Trazemos o nome do utilizador global
import { Button, Card, CardBody, Input, FormGroup, Label } from 'reactstrap';

const Profile = () => {
    // 1. Estados base do Slide 9
    const { user } = useUserContext(); // Usamos o nosso Contexto em vez de fazer outro axios.get ao User
    const [profile, setProfile] = useState({});
    const navigate = useNavigate();

    // 2. Estados para a imagem (Slide 10)
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const URL_PROFILE = 'http://localhost:8000/core/api/profile/';

    // Função para ir buscar o perfil à BD (Slide 9)
    const getProfile = () => {
        axios.get(URL_PROFILE, { withCredentials: true })
            .then(res => setProfile(res.data))
            .catch(err => console.error('Failed to load profile:', err));
    };

    // Corre automaticamente quando a página abre (Slide 9)
    useEffect(() => {
        getProfile();
    }, []);

    // 3. Handler para quando o utilizador escolhe um ficheiro no PC (Slide 10)
    const handleImageSelection = (e) => {
        e.preventDefault();
        const selectedImage = e.target.files[0];
        if (selectedImage) {
            setImage(selectedImage);
            setPreviewUrl(URL.createObjectURL(selectedImage)); // Cria um URL falso para a pré-visualização
        } else {
            setImage(null);
            setPreviewUrl('');
        }
    };

    // 4. Função MUITO IMPORTANTE para o Django aceitar a imagem (Slide 11)
    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    };

    // 5. Handler para enviar a imagem para o Django (Slide 11)
    const handleUpload = (e) => {
        e.preventDefault();
        if (image) {
            const updatedProfile = { ...profile, imagem: image };

            // O PUT precisa de cabeçalhos especiais de segurança e de formatação de ficheiros
            axios.put(URL_PROFILE, updatedProfile, {
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            })
            .then(() => {
                getProfile(); // Recarrega o perfil para mostrar a imagem nova guardada na BD
                setPreviewUrl(''); // Limpa a pré-visualização
                alert("Imagem atualizada com sucesso!");
            })
            .catch(err => console.error('Failed to update profile:', err));
        }
    };

    return (
        <div className="mt-5 d-flex flex-column align-items-center">
            {/* Secção do Perfil (Slide 12) */}
            <Card className="shadow-sm mb-4" style={{ width: '400px', textAlign: 'center' }}>
                <CardBody>
                    <h2>O meu perfil</h2>
                    <p className="text-muted">Username: <strong>{user}</strong></p>

                    {/* A imagem vem do Django. O localhost:8000 é necessário porque a BD só guarda "/core/media/..." */}
                    {profile.imagem && (
                        <img
                            src={`http://localhost:8000${profile.imagem}`}
                            alt="Imagem de Perfil"
                            style={{ height: '150px', width: '150px', objectFit: 'cover', borderRadius: '50%' }}
                            className="mb-3 shadow-sm"
                        />
                    )}
                    <br />
                    <Button color="secondary" outline onClick={() => navigate("/")}>Voltar</Button>
                </CardBody>
            </Card>

            {/* Secção de Upload (Slide 12) */}
            <Card className="bg-light shadow-sm" style={{ width: '400px' }}>
                <CardBody>
                    <h4>Carregar imagem de perfil</h4>
                    <FormGroup className="mt-3">
                        <Input type="file" onChange={handleImageSelection} accept="image/*" />
                    </FormGroup>

                    <Button color="primary" block onClick={handleUpload} disabled={!image}>
                        Upload
                    </Button>

                    {/* Mostra a imagem pequenina antes de enviar */}
                    {previewUrl && (
                        <div className="mt-3 text-center">
                            <p className="text-muted small mb-1">Pré-visualização:</p>
                            <img src={previewUrl} alt="Preview" style={{ height: '100px', borderRadius: '10px' }} />
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default Profile;