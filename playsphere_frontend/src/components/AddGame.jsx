import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, CardTitle, Row, Col } from 'reactstrap';
import { useUserContext } from './UserProvider';

const GENEROS_DISPONIVEIS = ["Ação", "Aventura", "RPG", "Estratégia", "Desporto", "Simulação", "FPS", "Corrida", "Indie"];

const AddGame = () => {
    const navigate = useNavigate();
    const { userRole } = useUserContext();

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [genero, setGenero] = useState(GENEROS_DISPONIVEIS[0]);
    const [preco, setPreco] = useState(0.00);
    const [imagemPrincipal, setImagemPrincipal] = useState(null);

    const [publishers, setPublishers] = useState([]);
    const [publisherId, setPublisherId] = useState('');
    const [mostrarNovaPub, setMostrarNovaPub] = useState(false);
    const [novaPubNome, setNovaPubNome] = useState('');

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarEmpresas = () => {
        if (userRole === 'ADMIN') {
            axios.get('http://localhost:8000/core/api/publishers/', { withCredentials: true })
                .then(res => {
                    setPublishers(res.data);
                    if (res.data.length > 0) setPublisherId(res.data[0].id);
                });
        }
    };

    useEffect(() => { carregarEmpresas(); }, [userRole]);

    const handleCriarEmpresaRapida = () => {
        if(!novaPubNome) return;
        axios.post('http://localhost:8000/core/api/publishers/quick-create/', { username: novaPubNome, nome_empresa: novaPubNome }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(res => {
            alert("Empresa criada e adicionada!");
            setNovaPubNome('');
            setMostrarNovaPub(false);
            axios.get('http://localhost:8000/core/api/publishers/', { withCredentials: true }).then(response => {
                setPublishers(response.data);
                setPublisherId(res.data.id);
            });
        }).catch(() => alert("Erro ao registar empresa fantasma."));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descricao', descricao);
        formData.append('genero', genero);
        formData.append('preco', preco);
        if (imagemPrincipal) formData.append('imagem_principal', imagemPrincipal);
        if (userRole === 'ADMIN' && publisherId) formData.append('publisher_id', publisherId);

        axios.post('http://localhost:8000/core/api/games/', formData, {
            headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        })
        .then(() => {
            alert(userRole === 'ADMIN' ? "✅ Jogo criado e associado à empresa!" : "🚀 Jogo enviado para avaliação!");
            navigate('/');
        }).catch(() => alert("Erro ao submeter jogo."));
    };

    return (
        <Card className="shadow-sm border-0 mx-auto mt-4" style={{ maxWidth: '600px' }}>
            <CardBody>
                <CardTitle tag="h3" className="text-primary mb-4 fw-bold">➕ Submeter Novo Jogo</CardTitle>
                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label className="fw-bold">Título do Jogo</Label>
                        <Input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                    </FormGroup>
                    <Row>
                        <Col md="6">
                            <FormGroup>
                                <Label className="fw-bold">Género</Label>
                                <Input type="select" value={genero} onChange={(e) => setGenero(e.target.value)}>
                                    {GENEROS_DISPONIVEIS.map(g => <option key={g} value={g}>{g}</option>)}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md="6">
                            <FormGroup>
                                <Label className="fw-bold">Preço (€)</Label>
                                <Input type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} required />
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Label className="fw-bold">Imagem de Capa (Catálogo)</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setImagemPrincipal(e.target.files[0])} />
                    </FormGroup>

                    {userRole === 'ADMIN' && (
                        <div className="p-3 mb-3 bg-light border rounded">
                            <Label className="fw-bold text-danger">Empresa Detentora (Publisher)</Label>
                            <div className="d-flex gap-2">
                                <Input type="select" value={publisherId} onChange={(e) => setPublisherId(e.target.value)} disabled={mostrarNovaPub}>
                                    {publishers.map(pub => (
                                        <option key={pub.id} value={pub.id}>{pub.nome_empresa} ({pub.username})</option>
                                    ))}
                                </Input>
                                <Button color="secondary" type="button" onClick={() => setMostrarNovaPub(!mostrarNovaPub)}>
                                    {mostrarNovaPub ? 'Cancelar' : 'Nova...'}
                                </Button>
                            </div>
                            {mostrarNovaPub && (
                                <div className="mt-2 d-flex gap-2">
                                    <Input type="text" placeholder="Nome da Nova Empresa" value={novaPubNome} onChange={e => setNovaPubNome(e.target.value)} />
                                    <Button color="success" size="sm" type="button" onClick={handleCriarEmpresaRapida}>Criar</Button>
                                </div>
                            )}
                        </div>
                    )}

                    <FormGroup>
                        <Label className="fw-bold">Descrição</Label>
                        <Input type="textarea" rows="4" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                    </FormGroup>
                    <Button color="primary" type="submit" className="w-100 fw-bold py-2">Gravar Jogo</Button>
                </Form>
            </CardBody>
        </Card>
    );
};

export default AddGame;