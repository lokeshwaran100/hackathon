/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable react/jsx-filename-extension */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import Wallet, { castVote, init, claimAmount, getView } from './Wallet';
import { decodeView } from './buffer';

function VotePage() {
    const params = useParams();
    const { electionId } = {'electionId': '5179'};

    const [client, setClient] = useState();
    const [connectedAccount, setConnectedAccount] = useState();
    const [view, setView] = useState();

    const [amountToDonate, setAmountToDonate] = useState('');
    const [amountToClaim, setAmountToClaim] = useState('');

    // Attempt to initialize Browser Wallet Client.
    useEffect(() => {
        init(setConnectedAccount).then(setClient).catch(console.error);
    }, []);

    // // Attempt to get general information about the election.
    // useEffect(() => {
    //     if (client) {
    //         getView(client, electionId).then(setView).catch(console.error);
    //     }
    // }, [client, electionId]);

    // // Decode general information about the election.
    // const viewResult = useMemo(() => {
    //     if (view) {
    //         return decodeView(view.returnValue);
    //     }
    // }, [view]);

    return (
        <Container>
            <Row>
                <Col>
                    <Wallet
                        client={client}
                        connectedAccount={connectedAccount}
                        setConnectedAccount={setConnectedAccount}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <h1>Vote in Election {electionId}*</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <h2></h2>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form>
                        <h2>Donation Amount</h2>
                        <Form.Control
                        placeholder="Enter amount to donate."
                        value={amountToDonate}
                        onChange={(e) => setAmountToDonate(e.target.value)}
                        />
                        <Button
                            className="w-100"
                            onClick={() =>
                                castVote(client, electionId, amountToDonate, connectedAccount)
                            }
                        >
                            <strong>Donate!</strong>
                        </Button>
                    </Form>
                    <ul />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form>
                        <h2>Claim Amount</h2>
                        <Form.Control
                        placeholder="Enter amount to claim."
                        value={amountToClaim}
                        onChange={(e) => setAmountToClaim(e.target.value)}
                        />
                        <Button
                            className="w-100"
                            onClick={() =>
                                claimAmount(client, electionId, amountToClaim, connectedAccount)
                            }
                        >
                            <strong>Claim!</strong>
                        </Button>
                    </Form>
                    <ul />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Link to={`/results/${electionId}`}>
                        <Button className="btn-secondary font-weight-bold">
                            <strong>Results</strong>
                        </Button>
                    </Link>
                </Col>
            </Row>
            <br />
            <br />
            <br />
            <br />
            <footer>
                <p>*Smart contract index on the Concordium chain</p>
            </footer>
        </Container>
    );
}

export default VotePage;
