import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Table, Button, Input, Spinner, Card, CardBody, CardTitle } from 'reactstrap';

const Library = () => {
    const [libraryItems, setLibraryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarBiblioteca = () => {
        axios.get('http://localhost:8000/core/api/library/', { withCredentials: true })
            .then(res => { setLibraryItems(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { carregarBiblioteca(); }, []);

    const handleAtualizarItem = (id, novoEstado, novaNota) => {
        axios.put(`http://localhost:8000/core/api/library/${id}/`, { estado: novoEstado, nota: novaNota }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarBiblioteca());
    };

    const handleRemoverItem = (id) => {
        if (window.confirm("Remover da biblioteca?")) {
            axios.delete(`http://localhost:8000/core/api/library/${id}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarBiblioteca());
        }
    };

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    const aJogar = libraryItems.filter(item => item.estado === 'A_JOGAR');
    const concluidos = libraryItems.filter(item => item.estado === 'CONCLUIDO');
    const queroJogar = libraryItems.filter(item => item.estado === 'QUERO_JOGAR');

    const renderTabelaCategoria = (itens, titulo, corDestaque) => (
        <Card className="mb-4 border-0 shadow-sm">
            <CardBody>
                <CardTitle tag="h4" className={`text-${corDestaque} fw-bold mb-3`}>{titulo} ({itens.length})</CardTitle>
                {itens.length === 0 ? <p className="text-muted fst-italic small ms-2">Sem jogos nesta secção.</p> : (
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Título do Jogo</th>
                                <th style={{ width: '180px' }}>Estado</th>
                                <th style={{ width: '140px' }}>A tua Nota</th> {/* <--- TEXTO CORRIGIDO AQUI */}
                                <th style={{ width: '60px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <Link to={`/jogo/${item.game}`} className="fw-bold text-primary text-decoration-none">
                                            🎮 {item.titulo_jogo}
                                        </Link>
                                    </td>
                                    <td>
                                        <Input type="select" size="sm" value={item.estado} onChange={(e) => handleAtualizarItem(item.id, e.target.value, item.nota)}>
                                            <option value="QUERO_JOGAR">Quero Jogar</option>
                                            <option value="A_JOGAR">A Jogar</option>
                                            <option value="CONCLUIDO">Concluído</option>
                                        </Input>
                                    </td>
                                    <td>
                                        <Input type="select" size="sm" value={item.nota || ''} onChange={(e) => handleAtualizarItem(item.id, item.estado, e.target.value)}>
                                            <option value="">--</option>
                                            {[...Array(10).keys()].map(n => <option key={n + 1} value={n + 1}>⭐ {n + 1}/10</option>)}
                                        </Input>
                                    </td>
                                    <td><Button color="danger" outline size="sm" onClick={() => handleRemoverItem(item.id)}>🗑️</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </CardBody>
        </Card>
    );

    return (
        <div className="mt-4">
            {/* TEXTO DO TÍTULO CORRIGIDO AQUI */}
            <h2 className="mb-4 text-primary fw-bold">📚 Minha Biblioteca Pessoal</h2>
            {renderTabelaCategoria(aJogar, "🎮 A Jogar Ativamente", "primary")}
            {renderTabelaCategoria(concluidos, "✅ Concluídos", "success")}
            {renderTabelaCategoria(queroJogar, "⏳ Quero Jogar", "warning")}
        </div>
    );
};

export default Library;