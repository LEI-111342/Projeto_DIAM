import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, Table, Button, Spinner, Badge } from 'reactstrap';
import { useUserContext } from './UserProvider';

const AdminPublishers = () => {
    const [publishers, setPublishers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userRole } = useUserContext();

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarEmpresas = () => {
        axios.get('http://localhost:8000/core/api/admin/publishers/all/', { withCredentials: true })
            .then(res => { setPublishers(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { carregarEmpresas(); }, []);

    const handleAprovar = (profileId) => {
        axios.put(`http://localhost:8000/core/api/publishers/${profileId}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarEmpresas());
    };

    const handleResetPassword = (userId) => {
        if(window.confirm("Queres fazer reset da password desta empresa para 'PlaySphere2026!'?")) {
            axios.post(`http://localhost:8000/core/api/admin/publishers/${userId}/reset-password/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => alert("✅ Password alterada com sucesso para: PlaySphere2026!"));
        }
    };

    if (userRole !== 'ADMIN') return <p className="text-danger mt-5 text-center">Acesso Negado.</p>;
    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    return (
        <div className="mt-4">
            <h2 className="mb-4 text-primary fw-bold">🏢 Gestão de Empresas (Publishers)</h2>
            <Card className="border-0 shadow-sm">
                <CardBody>
                    <CardTitle tag="h5" className="mb-3 text-secondary">Empresas Registadas na Plataforma</CardTitle>
                    <Table hover responsive className="align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Nome da Empresa</th>
                                <th>Username (Login)</th>
                                <th>E-mail</th>
                                <th>Estado</th>
                                <th>Ações Administrativas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {publishers.map(pub => (
                                <tr key={pub.id}>
                                    <td className="fw-bold">{pub.nome_empresa || '--'}</td>
                                    <td>{pub.username}</td>
                                    <td>{pub.email || 'Sem email'}</td>
                                    <td>{pub.aprovado ? <Badge color="success">Ativo</Badge> : <Badge color="warning" className="text-dark">Pendente</Badge>}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            {!pub.aprovado && <Button color="success" size="sm" onClick={() => handleAprovar(pub.id)}>Aprovar</Button>}
                                            <Button color="primary" size="sm" tag={Link} to={`/admin/empresas/${pub.user_id}`}>Gerir Perfil</Button>
                                            <Button color="danger" outline size="sm" onClick={() => handleResetPassword(pub.user_id)}>Reset Pw</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
};
export default AdminPublishers;