import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Spinner, Badge } from 'reactstrap';
import moment from 'moment';
import { useUserContext } from './UserProvider';

const Forum = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [novoTitulo, setNovoTitulo] = useState('');
    const [novoConteudo, setNovoConteudo] = useState('');

    const { user, userRole } = useUserContext();

    const getCSRFToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    const carregarPosts = () => {
        axios.get('http://localhost:8000/core/api/forum/')
            .then(res => {
                setPosts(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        carregarPosts();
    }, []);

    const handleCriarPost = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8000/core/api/forum/', { titulo: novoTitulo, conteudo: novoConteudo }, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            setNovoTitulo('');
            setNovoConteudo('');
            carregarPosts();
        })
        .catch(() => alert("Erro ao criar o tópico."));
    };

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    return (
        <div className="mt-4">
            <h2 className="mb-4 text-primary">💬 Fórum da Comunidade</h2>

            {user && userRole === 'GAMER' && (
                <Card className="shadow-sm border-0 mb-5 bg-light">
                    <CardBody>
                        <CardTitle tag="h5" className="mb-3">Criar um Novo Tópico</CardTitle>
                        <Form onSubmit={handleCriarPost}>
                            <FormGroup>
                                <Label className="fw-bold">Título da Discussão</Label>
                                <Input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} required />
                            </FormGroup>
                            <FormGroup>
                                <Label className="fw-bold">Conteúdo</Label>
                                <Input type="textarea" rows="3" value={novoConteudo} onChange={(e) => setNovoConteudo(e.target.value)} required />
                            </FormGroup>
                            <Button color="primary" type="submit">Publicar Tópico</Button>
                        </Form>
                    </CardBody>
                </Card>
            )}

            {posts.length === 0 ? (
                <p className="text-muted">O fórum ainda está vazio.</p>
            ) : (
                <div className="list-group shadow-sm">
                    {posts.map(post => (
                        <Link key={post.id} to={`/forum/${post.id}`} className="list-group-item list-group-item-action p-4 border-0 border-bottom">
                            <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                                <h5 className="mb-0 text-primary fw-bold">{post.titulo}</h5>
                                <small className="text-muted">{moment(post.data_criacao).format("DD/MM/YYYY HH:mm")}</small>
                            </div>
                            <p className="mb-3 text-truncate text-secondary" style={{ maxHeight: '25px' }}>{post.conteudo}</p>

                            <div className="d-flex justify-content-between align-items-center">
                                {/* FOTO DE PERFIL NA LISTA DO FÓRUM */}
                                <div className="d-flex align-items-center gap-2">
                                    <img
                                        src={`http://localhost:8000${post.autor_imagem}`}
                                        alt="Perfil"
                                        style={{ width: '25px', height: '25px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <small className="fw-bold text-dark">{post.autor_nome}</small>
                                </div>
                                <Badge color="info" pill className="px-3 py-2 text-dark">
                                    {post.numero_comentarios} Comentários
                                </Badge>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Forum;