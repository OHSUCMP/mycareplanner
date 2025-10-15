import React from 'react';
import './QuestionnaireComponent.css';
import {
    QuestionnaireItem,
    QuestionnaireResponse
} from '../../data-services/fhir-types/fhir-r4';
import QuestionnaireItemComponent from '../questionnaire-item/QuestionnaireItemComponent';
import ReviewPageComponent from '../review-page/ReviewPageComponent';
import { Button } from 'react-bootstrap';
import { faArrowAltCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { doLog, LogRequest } from '../../log';
import { isScoreQuestion } from '../../data-services/questionnaireService';

interface QuestionnaireState {
    showConfirmation: boolean,
    showReviewInfo: boolean,
    showModal: boolean
}

export default class QuestionnaireComponent extends React.Component<any, QuestionnaireState> {
    constructor(props: any) {
        super(props);
        this.state = {
            showConfirmation: false,
            showReviewInfo: false,
            showModal: false
        }
    }

    componentDidMount(): void {

        let request : LogRequest={
            level: 'info',
            event: 'Clicked',
            page: 'Questionnaire',
            message: 'User visited Questionnaire Tab',
        }

        doLog(request)
    }

    questionnaireResponse: QuestionnaireResponse = this.props.questionnaireResponse;
    receiveData = (showReview: boolean) => {
        if (showReview === true) {
            this.setState({
                showReviewInfo: true,
                showConfirmation: false
            }, () => {
            })
        }
    }

    render(): JSX.Element {
        return <div className="questionnaire">
            {/* <div>{this.props.questionnaire.title}</div> */}
            {this.props.questionnaire.item.filter((item: QuestionnaireItem, key: any) => {
                // Remove score questions from the display
                return !isScoreQuestion(item);
            }).map((item: QuestionnaireItem, key: any) => {
                return <QuestionnaireItemComponent receivingCallback={this.receiveData} length={this.props.questionnaire.item?.length} QuestionnaireItem={item} key={key} onChange={this.props.onChange} />
            })}
            <div className={!this.state.showReviewInfo ? 'hidden' : ''}>
                {
                    <div>
                        <Button className="btn-outline-secondary edit-button"
                            // value={this.props.QuestionnaireItem.linkId}
                            onClick={(event: any) => {
                                this.setState({ showReviewInfo: false })
                                this.props.onEdit()
                            }}>
                            <FontAwesomeIcon icon={faArrowAltCircleLeft} />
                        </Button>
                        <div>
                            <h4>Review and Submit</h4>
                            <ReviewPageComponent goEdit={this.props.onEdit} {...this.props.questionnaireResponse}></ReviewPageComponent>
                        </div>

                        <div className="submit-confirmation-text">
                            <p>Once you are satisfied with your responses, click the continue button below.</p>
                        </div>

                        <Button className="continue-button" type="button" onClick={this.props.onSubmit}><FontAwesomeIcon icon={faCheck} /> Continue</Button>
                    </div>
                }
            </div>

        </div>

    }

}
