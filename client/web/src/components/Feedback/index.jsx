/**
 * src/components/Feedback/index.jsx
 * Submit feedback.
 *
 * created by pycui on 8/5/23
 */
import React, { useState } from 'react';
import Modal from 'react-modal';
import { isIP } from 'is-ip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import Button from '../Common/Button';
import './style.css';

Modal.setAppElement('#root'); // replace '#root' with the id of the root div of your app

function Feedback({ messageId, token }) {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [comment, setComment] = useState("");

    const handleFeedbackChange = (e) => {
        setFeedback(e.target.value);
    };

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handleSubmit = () => {
        // call /feedback API to submit feedback
        console.log(messageId);
        console.log(feedback, comment);
        // Get host
        const scheme = window.location.protocol;
        var currentHost = window.location.host;
        var parts = currentHost.split(':');
        var hostname = parts[0];
        // Local deployment uses 8000 port by default.
        var newPort = '8000';

        if (!(hostname === 'localhost' || isIP(hostname))) {
            hostname = 'api.' + hostname;
            newPort = window.location.protocol === "https:" ? 443 : 80;
        }
        var newHost = hostname + ':' + newPort;
        const url = scheme + '//' + newHost + '/feedback';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message_id: messageId,
                feedback: feedback,
                comment: comment,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data);
            }).catch((error) => {
                console.error('Error:', error);
            });

        // Close the modal
        setModalIsOpen(false);
    };

    return (
        <div>
            <FontAwesomeIcon icon={faThumbsUp} style={{ cursor: 'pointer', color: 'LightSkyBlue' }} onClick={() => setModalIsOpen(true)} />
            <FontAwesomeIcon icon={faThumbsDown} style={{ cursor: 'pointer', color: 'RebeccaPurple' }} onClick={() => setModalIsOpen(true)} />
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                className="react-modal-content"
                overlayClassName="react-modal-overlay"
            >
                <h3>Feedback</h3>
                <select value={feedback} onChange={handleFeedbackChange}>
                    <option value="" disabled>Choose a rating</option>
                    <option value="great">Great</option>
                    <option value="okay">Okay</option>
                    <option value="bad">Bad</option>
                </select>
                <textarea value={comment} onChange={handleCommentChange} placeholder="Leave a comment (optional)" />
                <div className="button-row">
                <Button onClick={handleSubmit} name="Submit feedback" />
                <Button onClick={() => setModalIsOpen(false)} name="Cancel" />
                </div>
            </Modal>
        </div>
    );
}

export default Feedback;
