import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Input, Spinner, Card, CardBody, CardTitle } from 'reactstrap';
import moment from 'moment';

const Library = () => {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);

    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    };

    const fetchLibrary = () => {
        axios.get('http://localhost:8000/core/api/library/', { withCredentials: true })
            .then(res => {
                setLibrary(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao carregar biblioteca", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLibrary();
    }, []);

    const updateStatus = (itemId, newStatus) => {
        axios.put(`http://localhost:8000/core/api/library/${itemId}/`, { estado: newStatus }, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => fetchLibrary()) // Recarrega a lista para mostrar a alteração
        .catch(err => console.error("Erro ao atualizar estado", err));
    };

    const removeItem = (itemId) => {
        if (window.confirm("Queres remover este jogo da tua biblioteca?")) {
            axios.delete(`http://localhost:8000/core/api/library/${itemId}/`, {
                headers: { 'X-CSRFToken': getCSRFToken() },
                withCredentials: true
            })
            .then(() => fetchLibrary())
            .catch(err => console.error("Erro ao remover jogo", err));
        }
    };

    if (loading) return <Spinner color="primary" className="mt-5" />;

    return (
        <div className="mt-4">
            <Card className="shadow-sm border-0">
                <CardBody>
                    <CardTitle tag="h2" className="mb-4 text-primary">📚 A Minha Biblioteca Pessoal</CardTitle>

                    {library.length === 0 ? (
                        <p className="text-muted">A tua biblioteca está vazia. Vai ao catálogo procurar jogos!</p>
                    ) : (
                        <Table responsive hover className="align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Jogo</th>
                                    <th>Adicionado em</th>
                                    <th>Estado Atual</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {library.map(item => (
                                    <tr key={item.id}>
                                        <td className="fw-bold">{item.titulo_jogo}</td>
                                        <td>{moment(item.data_adicao).format("DD/MM/YYYY")}</td>
                                        <td>
                                            <Input
                                                type="select"
                                                value={item.estado}
                                                onChange={(e) => updateStatus(item.id, e.target.value)}
                                                style={{ width: '150px' }}
                                            >
                                                <option value="QUERO_JOGAR">Quero Jogar</option>
                                                <option value="A_JOGAR">A Jogar</option>
                                                <option value="CONCLUIDO">Concluído</option>
                                            </Input>
                                        </td>
                                        <td>
                                            <Button color="danger" size="sm" outline onClick={() => removeItem(item.id)}>
                                                Remover
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default Library;