/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable react/jsx-filename-extension */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import Wallet, { castVote, init, claimAmount, getView } from './Wallet';
import { decodeView } from './buffer';
import {campaigns} from './data'

function Campaign() {
    

    const params = useParams();
    const { cmpId } = params;

    function findCampaignById(id) {
        return campaigns.find(campaign => campaign.id === id);
    }
    
    const choiseCampaign = findCampaignById((cmpId));

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
    //         getView(client, cmpId).then(setView).catch(console.error);
    //     }
    // }, [client, cmpId]);

    // // Decode general information about the election.
    // const viewResult = useMemo(() => {
    //     if (view) {
    //         return decodeView(view.returnValue);
    //     }
    // }, [view]);

    return (
        <Container style={{maxWidth:'40rem'}}>
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
                    <p>Campaign</p>
                    <h1>{choiseCampaign.name}</h1>
                    <br/>
                    <p>{choiseCampaign.desc}</p>
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
                        
                    <br/>
                        <h2>Donation Amount</h2>
                        <Form.Control
                        placeholder="Enter amount to donate."
                        value={amountToDonate}
                        onChange={(e) => setAmountToDonate(e.target.value)}
                        />
                        <br/>
                        <Button
                            className="w-100"
                            onClick={() =>
                                castVote(client, cmpId, amountToDonate, connectedAccount)
                            }
                        >
                            <strong>Donate!</strong>
                        </Button>
                    </Form>
                    <ul />
                </Col>
            </Row>
                        <br/>
                        <br/>
            <Row>
                <Col>
                    <Form>
                        <h2>Claim Amount</h2>
                        <Form.Control
                        placeholder="Enter amount to claim."
                        value={amountToClaim}
                        onChange={(e) => setAmountToClaim(e.target.value)}
                        />
                        <br/>
                        <Button
                            className="w-100"
                            onClick={() =>
                                claimAmount(client, cmpId, amountToClaim, connectedAccount)
                            }
                        >
                            <strong>Claim!</strong>
                        </Button>
                    </Form>
                    <ul />
                </Col>
            </Row>
            <br />
            <br />
            <br />
            <br />
            <footer>
            </footer>
        </Container>
    );
}

export default Campaign;
