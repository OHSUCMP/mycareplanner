import React, { createRef } from 'react';
import { QuestionnaireItem, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from '../../data-services/fhir-types/fhir-r4';
import './QuestionnaireItemComponent.css';
import { Card, Button, Modal } from 'react-bootstrap';
import { faArrowAltCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChoiceDropDown from './ChoiceDropDown';
// import MultiSelectButtonComponent from '../multi-select-button/MultiSelectButton';
import parser from 'html-react-parser';
import YouTube from 'react-youtube';
// import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'
// import { isNullOrUndefined } from 'util';
import Grid from '@mui/material/Grid';
import { isScoreQuestion } from '../../data-services/questionnaireService';

interface QuestionnaireItemState {
  showReview: boolean,
  showCancelPopup: boolean,
  questionnaireResponse: QuestionnaireResponseItem
}
export default class QuestionnaireItemComponent extends React.Component<any, QuestionnaireItemState> {
  constructor(props: any) {
    super(props);
    this.state = {
      showReview: false,
      showCancelPopup: false,
      questionnaireResponse: {
        linkId: props.QuestionnaireItem.linkId,
        text: (props.QuestionnaireItem.prefix !== undefined ? props.QuestionnaireItem.prefix + ": " : "") + props.QuestionnaireItem.text,
        item: [],
      }
    }
  }
  questionnaireItemRef: any = createRef();
  vidRef: any = createRef();

  handleCancelClick = () => {
    this.setState({ showCancelPopup: true });
  };

  handleCancelDeny = () => {
    this.setState({ showCancelPopup: false });
  };
  
  handleCancelConfirm = () => {
    window.location.href = '/index.html';
  };

  handleNextQuestionScroll(linkId: number) {
    if (this.questionnaireItemRef.current.id === linkId) {
      if (this.vidRef.current !== null) {
        this.stopVideos();
      }
      if (this.questionnaireItemRef.current.nextSibling) {
        this.questionnaireItemRef.current.nextSibling.classList.add('active')
        this.questionnaireItemRef.current.classList.remove('active')
        this.questionnaireItemRef.current.nextSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
        // console.log('current ref: ', this.questionnaireItemRef.current.children)
      }
    }
    if (!this.questionnaireItemRef.current.nextSibling.classList.contains('questionnaire-item')) {
      this.setState({ showReview: true }, () => {
        this.props.receivingCallback(this.state.showReview);
      });
    }
  }
  handlePreviousQuestionScroll(linkId: number) {
    if (this.questionnaireItemRef.current.id === linkId && this.questionnaireItemRef.current.previousSibling !== null) {
      if (this.vidRef.current !== null) {
        this.stopVideos();
      }
      this.questionnaireItemRef.current.previousSibling.classList.add('active')
      this.questionnaireItemRef.current.classList.remove('active')
      this.questionnaireItemRef.current.previousSibling.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }

  }
  stopVideos() {
    let videos = document.querySelectorAll('iframe, video');
    Array.prototype.forEach.call(videos, function (video) {
      if (video.tagName.toLowerCase() === 'video') {
        video.pause();
      } else {
        var src = video.src;
        video.src = src;
      }
    });
  }

  public render(): JSX.Element {
    let text = '';
    if (!this.props.QuestionnaireItem.text) {
      text = ''
    } else {
      text = this.props.QuestionnaireItem.text
    }

    let recordWebsiteVisit = (event: any) => {
      let timeStamp: any = new Date().toISOString();
      this.processResponse(this.props.QuestionnaireItem, JSON.stringify({ valueDateTime: timeStamp }))
    }
    const vidOptions = {
      width: "100%",
      height: "200",
      playerVars: {
      }
    }


    const options = {
      replace: (domNode: any) => {
        // embedded YouTube video
        if (domNode?.next?.attribs?.id === 'youtube' && domNode?.next?.attribs?.value !== undefined) {
          let youtubeId = domNode?.next?.attribs?.value
          return <YouTube
            id="youtube-video"
            ref={this.vidRef}
            videoId={youtubeId}
            opts={vidOptions}
            onEnd={recordWebsiteVisit}
          />
          // website link
        } else if (domNode?.next?.attribs?.id === 'website' && domNode?.next?.attribs?.value !== undefined) {
          let website = domNode?.next?.attribs?.value
          return <a id="replace" className="d-flex justify-content-center mt-1" target="_blank"
            rel="noopener noreferrer" href={website} ><button onClick={recordWebsiteVisit} className="btn btn-outline-secondary">Visit Web Site</button></a>
        }
      }
    }


    return (
      <Card ref={this.questionnaireItemRef} className={"questionnaire-item"} id={this.props.QuestionnaireItem.linkId}>
        <div className="questionnaire-section-header">
        {(this.props.QuestionnaireItem.linkId !== ('physical-function')) && (this.props.QuestionnaireItem.linkId !== ('112346')) && (this.props.QuestionnaireItem.linkId !== ('caregiver-strain-group')) && (this.props.QuestionnaireItem.linkId !== ('phq9')) ? (
              <Button className="btn-outline-secondary previous-button"
                value={this.props.QuestionnaireItem.linkId}
                onClick={(event: any) => this.handlePreviousQuestionScroll(event.target.value)}>
                <FontAwesomeIcon
                  icon={faArrowAltCircleLeft}
                  onClick={(event: any) => this.handlePreviousQuestionScroll(this.props.QuestionnaireItem.linkId)} />
              </Button>
            ): null}
          {this.props.QuestionnaireItem.prefix !== undefined ? <div className="prefix-text">
            <h3>{this.props.QuestionnaireItem.prefix}</h3>
          </div> : <div />}
        </div>

        {/* For groups, show item text as H4 header */}
        {this.props.QuestionnaireItem.type === "group" ? <div className="description-text">
          <h4> {parser(text, options)}</h4>
        </div> : <div />}

        {/* For display items, modify the text to show YouTube videos or embedded images, if included in the question HTML text. */}
        {this.props.QuestionnaireItem.type === "display" ? <div className="description-text">
          {parser(text, options)}
        </div> : <div />}

        <div>
          {
            this.props.QuestionnaireItem.type === "boolean" ?
              <div className="boolean-type">
                <p className="question-text">{this.props.QuestionnaireItem.text}</p>
                <p>&nbsp;</p>
                <div className="radio-button">
                  <input type="radio" name={this.props.QuestionnaireItem.linkId} onChange={() => {
                    this.processResponse(this.props.QuestionnaireItem, JSON.stringify({ valueBoolean: true }))
                  }} />
                  <label htmlFor={this.props.QuestionnaireItem.linkId}> Yes</label>
                </div>
                <div className="radio-button">
                  <input type="radio" name={this.props.QuestionnaireItem.linkId} onChange={() => this.props.onChange(this.props.QuestionnaireItem, [{ valueBoolean: false }])} /><label htmlFor={this.props.QuestionnaireItem.linkId}> No</label>
                </div>
              </div>
              : this.props.QuestionnaireItem.type === "choice" ?
                <div className="choice-type">
                  {this.populateChoice(this.props.QuestionnaireItem)}
                </div>
                : (this.props.QuestionnaireItem.type === "quantity" || this.props.QuestionnaireItem.type === "decimal") ?
                  <div className="question-group">
                    <p className="question-text">{this.props.QuestionnaireItem.text}</p>
                    <input type="number" onChange={(event) => this.props.onChange(this.props.QuestionnaireItem, [{ valueQuantity: { value: parseFloat(event.target.value) } }])} />
                  </div>
                  : this.props.QuestionnaireItem.type === "group" ?
                    <div className="open-choice-type">
                      {this.populateGroupType(this.props)}
                    </div>

                    : (this.props.QuestionnaireItem.type === "text" || this.props.QuestionnaireItem.type === "string") ?
                      <div className="question-group">
                        <p className="question-text">{this.props.QuestionnaireItem.text}</p>
                        <textarea placeholder="Type your answer here......"
                          onChange={(event) => {
                            this.processResponse(this.props.QuestionnaireItem, JSON.stringify({ valueString: event.target.value }))
                          }}
                        />
                      </div>
                      : <div></div>
          }
        </div>
        <Button className="btn btn-primary next-button" value={this.props.QuestionnaireItem.linkId} onClick={(event: any) => this.handleNextQuestionScroll(event.target.value)}>Next</Button>
     
        <Modal show={this.state.showCancelPopup} onHide={this.handleCancelDeny} className="custom-modal">
            <Modal.Header>
              <Modal.Title>Leave questionnaire?</Modal.Title>
            </Modal.Header>
            <Modal.Body>You will lose all the information entered for this questionnaire.</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={this.handleCancelDeny}>
              Stay
              </Button>
              <Button variant="primary" onClick={this.handleCancelConfirm}>
              Leave
              </Button>
            </Modal.Footer>
        </Modal>
      </Card>
    );
  }

  private processResponse = (questionItem: QuestionnaireItem, answer: any) => {
    let responseAnswer: QuestionnaireResponseItemAnswer = JSON.parse(answer);
    let childResponse: QuestionnaireResponseItem = {
      linkId: questionItem.linkId,
      text: questionItem.text,
      answer: [responseAnswer]
    };

    this.props.onChange(childResponse);
  }

  private populateChoice(item: QuestionnaireItem) {
    let receiveData = (childData: QuestionnaireItem, answer: string) => {
      let responseAnswer: QuestionnaireResponseItemAnswer = JSON.parse(answer)
      let childResponse: QuestionnaireResponseItem = {
        linkId: childData.linkId,
        text: childData.text,
        answer: [responseAnswer]
      };

      const addItem = (response: any) => {
        this.setState(state => {
          const questionnaireResponse = {
            linkId: state.questionnaireResponse.linkId,
            text: state.questionnaireResponse.text,
            item: state.questionnaireResponse.item!.concat(response)
          };

          return {
            showReview: this.state.showReview,
            questionnaireResponse
          }
        }, () => {
          this.props.onChange(this.state.questionnaireResponse);
        })
      }

      addItem(childResponse);
    }

    return (
      <ChoiceDropDown parentCallback={receiveData} key={JSON.stringify(item)} {...item}></ChoiceDropDown>
    );
  }

  private populateGroupType(props: any) {
    let groupItem = props.QuestionnaireItem

    return (
      <div>
        {
          groupItem.item?.filter((item: QuestionnaireItem, key: any) => {
            // Remove score questions from the display
            return isScoreQuestion(item)
          }).map((nestedItem: QuestionnaireItem) => {
            return (
              <div key={JSON.stringify(nestedItem)}>
                {
                  nestedItem.type === "boolean" ?
                    <div className="boolean-type">
                      <Grid container spacing={1}>
                        <Grid item xs={8}>
                          <p className="question-text">{nestedItem.text}</p>
                        </Grid>
                        <Grid item xs={2}>
                          <div className="radio-button">
                            <input type="radio" name={nestedItem.linkId} onChange={(event) => {
                              this.processResponse(nestedItem, JSON.stringify({ valueBoolean: true }))
                            }} />
                            <label htmlFor={nestedItem.linkId}> Yes</label>
                          </div>
                        </Grid>
                        <Grid item xs={2}>
                          <div className="radio-button">
                            <input type="radio" name={nestedItem.linkId} onChange={(event) => {
                              this.processResponse(nestedItem, JSON.stringify({ valueBoolean: false }))
                            }} />
                            <label htmlFor={nestedItem.linkId}> No</label>
                          </div>
                        </Grid>
                      </Grid>
                    </div>
                    : nestedItem.type === "choice" ?
                      <div className="choice-type">
                        {this.populateChoice(nestedItem)}
                      </div>
                      : (nestedItem.type === "quantity" || nestedItem.type === "decimal") ?
                        <div className="question-group">
                          <p className="question-text">{nestedItem.text}</p>
                          <input type="number"
                            onChange={(event) => {
                              this.processResponse(nestedItem, JSON.stringify({ valueQuantity: { value: parseFloat(event.target.value) } }))
                            }} />
                        </div>
                        : (nestedItem.type === "text" || nestedItem.type === "string") ?
                          <div className="question-group">
                            <p className="question-text">{nestedItem.text}</p>
                            <textarea placeholder="Type your answer here......"
                              onChange={(event) => {
                                this.processResponse(nestedItem, JSON.stringify({ valueString: event.target.value }))
                              }}
                            />
                          </div>
                          : <div></div>
                }
              </div>
            )
          })
        }
      </div>
    )
  }
}
