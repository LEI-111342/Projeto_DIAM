import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Card, CardBody, CardTitle, Table } from 'reactstrap';
import { useUserContext } from './UserProvider';

const Cart = () => {
    const { cart, setCart, user, userEmail } = useUserContext();
    const navigate = useNavigate();

    const getCSRFToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    const total = cart.reduce((sum, game) => sum + parseFloat(game.preco), 0);

    const handleRemove = (gameId) => {
        setCart(cart.filter(game => game.id !== gameId));
    };

    const generateFakeSteamKey = () => {
        const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${part()}-${part()}-${part()}`;
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;

        const game_ids = cart.map(game => game.id);

        axios.post('http://localhost:8000/core/api/checkout/', { jogos: game_ids }, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(res => {
            const keysMessage = cart.map(game => `🎮 ${game.titulo}: ${generateFakeSteamKey()}`).join('\n');

            // O ALERTA AGORA USA O TEU E-MAIL REAL ASSOCIADO À CONTA
            alert(`🎉 COMPRA EFETUADA COM SUCESSO!\n\nAs tuas chaves digitais foram enviadas para o teu e-mail associado:\n📧 ${userEmail || 'Desconhecido'}\n\nPara teu registo imediato, aqui estão elas:\n\n${keysMessage}\n\nOs jogos também foram adicionados automaticamente à tua Biblioteca!`);

            setCart([]);
            navigate('/biblioteca');
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao processar a compra.");
        });
    };

    if (!user) {
        return <div className="mt-5 alert alert-warning text-center">Tens de fazer login para ver o carrinho.</div>;
    }

    return (
        <div className="mt-4">
            <Card className="shadow-sm border-0">
                <CardBody>
                    <CardTitle tag="h2" className="mb-4 text-primary">🛒 O Teu Carrinho</CardTitle>

                    {cart.length === 0 ? (
                        <p className="text-muted">O teu carrinho está vazio. Vai ao catálogo procurar jogos!</p>
                    ) : (
                        <>
                            <Table responsive hover className="align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Jogo</th>
                                        <th>Preço</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((game, index) => (
                                        <tr key={index}>
                                            <td className="fw-bold">{game.titulo}</td>
                                            <td>{game.preco > 0 ? `${game.preco} €` : 'Gratuito'}</td>
                                            <td>
                                                <Button color="danger" size="sm" outline onClick={() => handleRemove(game.id)}>
                                                    Remover
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded shadow-sm">
                                <h4 className="mb-0">Total a Pagar: <span className="text-success">{total.toFixed(2)} €</span></h4>
                                <Button color="success" size="lg" onClick={handleCheckout}>
                                    💳 Finalizar Compra e Receber Chaves
                                </Button>
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default Cart;