import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Spinner, Row, Col, Badge, ListGroup, ListGroupItem } from 'reactstrap';
import { useUserContext } from './UserProvider';

const AdminPublisherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userRole } = useUserContext();

    const [pubData, setPubData] = useState(null);
    const [nomeEmpresa, setNomeEmpresa] = useState('');

    const [allGames, setAllGames] = useState([]);
    const [selectedGameId, setSelectedGameId] = useState('');

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarDados = () => {
        axios.get(`http://localhost:8000/core/api/admin/publishers/${id}/`, { withCredentials: true })
            .then(res => {
                setPubData(res.data);
                setNomeEmpresa(res.data.nome_empresa || '');
            }).catch(() => navigate('/admin/empresas'));

        axios.get('http://localhost:8000/core/api/admin/games-light/', { withCredentials: true })
            .then(res => setAllGames(res.data));
    };

    useEffect(() => {
        if (userRole === 'ADMIN') carregarDados();
    }, [id, userRole]);

    const handleAtualizarDados = (e) => {
        e.preventDefault();
        axios.put(`http://localhost:8000/core/api/admin/publishers/${id}/`, { nome_empresa: nomeEmpresa }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => { alert("Dados da empresa atualizados!"); carregarDados(); })
        .catch(() => alert("Erro ao atualizar os dados."));
    };

    const handleAssociarJogo = (e) => {
        e.preventDefault();
        if (!selectedGameId) return;

        axios.put(`http://localhost:8000/core/api/admin/publishers/${id}/assign-game/`, { game_id: selectedGameId }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => { alert("Jogo associado à empresa com sucesso!"); setSelectedGameId(''); carregarDados(); })
        .catch(() => alert("Erro ao associar o jogo."));
    };

    if (userRole !== 'ADMIN') return null;
    if (!pubData) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    // Filtra os jogos para o Dropdown (não mostra os que já são desta empresa)
    const gamesDisponiveis = allGames.filter(g => g.publisher_id !== pubData.user_id);

    return (
        <div className="mt-4">
            <Button color="secondary" outline className="mb-3" tag={Link} to="/admin/empresas">&larr; Voltar à Lista</Button>

            <h2 className="mb-4 text-primary fw-bold">⚙️ Gerir Perfil da Empresa</h2>

            <Row>
                <Col md="6">
                    <Card className="border-0 shadow-sm mb-4">
                        <CardBody>
                            <CardTitle tag="h5" className="fw-bold mb-3">Dados da Empresa</CardTitle>
                            <Form onSubmit={handleAtualizarDados}>
                                <FormGroup>
                                    <Label className="text-muted small fw-bold">Username (Login, não editável)</Label>
                                    <Input type="text" value={pubData.username} disabled />
                                </FormGroup>
                                <FormGroup>
                                    <Label className="text-muted small fw-bold">Email de Contacto (não editável)</Label>
                                    <Input type="text" value={pubData.email || 'Nenhum'} disabled />
                                </FormGroup>
                                <FormGroup>
                                    <Label className="fw-bold text-primary">Nome Comercial da Empresa</Label>
                                    <Input type="text" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} required />
                                </FormGroup>
                                <Button color="primary" className="w-100" type="submit">Guardar Nome</Button>
                            </Form>
                        </CardBody>
                    </Card>

                    <Card className="border-0 shadow-sm bg-danger bg-opacity-10 border-danger">
                        <CardBody>
                            <CardTitle tag="h6" className="fw-bold text-danger mb-3">Associar um Jogo a esta Empresa</CardTitle>
                            <p className="small text-muted mb-2">Transfere a propriedade de um jogo existente no catálogo para esta empresa.</p>
                            <Form onSubmit={handleAssociarJogo} className="d-flex gap-2">
                                <Input type="select" value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} required>
                                    <option value="">-- Escolher Jogo --</option>
                                    {gamesDisponiveis.map(g => (
                                        <option key={g.id} value={g.id}>{g.titulo} (Atual: {g.publisher_nome})</option>
                                    ))}
                                </Input>
                                <Button color="danger" type="submit">Associar</Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>

                <Col md="6">
                    <Card className="border-0 shadow-sm h-100">
                        <CardBody>
                            <CardTitle tag="h5" className="fw-bold mb-3">Jogos Publicados por esta Empresa</CardTitle>
                            {pubData.jogos.length === 0 ? <p className="text-muted fst-italic">Esta empresa ainda não tem jogos associados.</p> : (
                                <ListGroup flush>
                                    {pubData.jogos.map(g => (
                                        <ListGroupItem key={g.id} className="d-flex justify-content-between align-items-center px-0">
                                            <Link to={`/jogo/${g.id}`} className="text-decoration-none text-dark fw-bold">{g.titulo}</Link>
                                            {g.aprovado ? <Badge color="success">Aprovado no Catálogo</Badge> : <Badge color="warning" className="text-dark">Pendente</Badge>}
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminPublisherDetail;