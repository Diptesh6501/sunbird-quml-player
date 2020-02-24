import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CarouselComponent } from 'ngx-bootstrap/carousel';
import { questionSet } from './data';
import { questionSetHome } from './data-home';
import { QumlLibraryService } from '../quml-library.service';


@Component({
  selector: 'quml-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  @Input() questions: any;
  @Input() telemetry: any;
  @Output() componentLoaded = new EventEmitter<any>();
  @Output() previousClicked = new EventEmitter<any>();
  @Output() nextClicked = new EventEmitter<any>();
  @Output() questionClicked = new EventEmitter<any>();
  @ViewChild('car') car: CarouselComponent;

  endPageReached: boolean;
  slides: any;
  slideInterval: number;
  showIndicator: Boolean;
  noWrapSlides: Boolean;
  optionSelectedObj: any;
  showAlert: Boolean;
  skippedQuestion = 0;
  answeredQuestionCorrectly = 0;
  scoreSummary = {};
  questionData: any;
  currentQuestion: any;
  info: any;
  now = Date.now();
  after: any;
  defaultTelemetry = {
    did: '1234',
    profileId: '1234',
    stallId: '1234',
    ideaId: '1234',
    sid: '1234',
    type: 'class',
    profileUrl: 'http',
    name: 'diptesh'
  };
  CarouselConfig = {
    NEXT: 1,
    PREV: 2
  };

  constructor(public qumlLibraryService: QumlLibraryService) {
    this.endPageReached = false;
  }

  ngOnInit() {
    // this.telemetry = this.telemetry ? this.telemetry : this.defaultTelemetry;
    this.telemetry = window['queryParamsObj'];
    this.slideInterval = 0;
    this.showIndicator = false;
    this.noWrapSlides = true;
    this.init();
  }

  async init() {
    await this.getQuestionData();
    this.questions = this.questions ? this.questions : this.questionData;
    await this.setQuestionType();

  }

  async getQuestionData() {
    return this.qumlLibraryService.getQuestions().then((data) => {
    }).catch((e) => {
      if (this.telemetry.type === 'class') {
        this.questionData = questionSet.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question'];
      } else if (this.telemetry.type === 'home') {
        this.questionData = questionSetHome.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question'];
      }
    });
  }

  async setQuestionType() {
    this.questions.forEach(element => {
      if (typeof (element.config.__cdata) === 'string') {
        const config = JSON.parse(element.config.__cdata);
        element.questionType = config.metadata.type;
      } else {
        element.questionType = element.config.metadata.type;
      }
    });
  }

  nextSlide() {
    if (this.car.getCurrentSlideIndex() + 1 === this.questions.length) {
      this.endPageReached = true;
      this.getScoreSummary();
      if (this.currentQuestion) {
        this.qumlLibraryService.generateTelemetry(this.generateTelemetry());
      }
      return;
    }
    if (this.optionSelectedObj === undefined || Object.keys(this.optionSelectedObj).length === 0 ||
      this.optionSelectedObj.result === false) {
      this.car.move(this.CarouselConfig.NEXT);
      this.skippedQuestion = this.skippedQuestion + 1;
      this.scoreSummary['skippedQuestion'] = this.skippedQuestion;
    } else if (this.optionSelectedObj.result) {
      this.car.move(this.CarouselConfig.NEXT);
      this.scoreSummary['answeredQuestionCorrectly'] = this.answeredQuestionCorrectly++;
    }
    // devcon
    // else if (this.optionSelectedObj.result === false) {
    // this.showAlert = true;
    // }
    this.after = Date.now();
    console.log('current question value is', this.currentQuestion);
    if (this.currentQuestion) {
      this.qumlLibraryService.generateTelemetry(this.generateTelemetry());
    }
    this.now = Date.now();
    this.optionSelectedObj = {};
  }

  getScoreSummary() {
    return this.scoreSummary = {
      answeredQuestionCorrectly: this.answeredQuestionCorrectly,
      skippedQuestion: this.skippedQuestion,
      totalNoOfQuestions: this.questions.length
    };
  }

  skip() {
    this.car.move(this.CarouselConfig.NEXT);
    // this.showAlert = false;
    this.optionSelectedObj = {};
  }


  getOptionSelected(optionSelected, question) {
    console.log('option selected', optionSelected);
    console.log('question', question);
    this.currentQuestion = question;
    if (this.currentQuestion) {
      this.info = {
        name: JSON.parse(this.currentQuestion.config.__cdata).metadata.name,
        author: JSON.parse(this.currentQuestion.config.__cdata).metadata.author
      };
    }
    console.log('info is', this.info);
    this.optionSelectedObj = optionSelected;
  }

  prevSlide() {
    if (this.car.getCurrentSlideIndex() + 1 === this.questions.length && this.endPageReached) {
      this.endPageReached = false;
    } else {
      this.car.move(this.CarouselConfig.PREV);
    }
  }

  addSlide() {
    this.slides.push(this.questions.length);
  }

  removeSlide() {
    this.slides.length = this.slides.length - 1;
  }

  nextSlideClicked(event) {
    if (event = 'next clicked') {
      this.nextSlide();
    }
  }

  generateTelemetry() {
    console.log('this . telemetry generated here', this.telemetry);
    this.telemetry.contentId = this.currentQuestion.id;
    this.telemetry.questionId = JSON.parse(this.currentQuestion.config.__cdata).metadata.identifier;
    this.telemetry.contentType = this.currentQuestion.type;
    this.telemetry.contentName = JSON.parse(this.currentQuestion.config.__cdata).metadata.name;
    this.telemetry.edata = {};
    this.telemetry.edata.duration = Math.round((this.after - this.now) / 1000);
    this.telemetry.edata.maxScore = '0';
    this.telemetry.edata.score = '0';
    if (Boolean(Object.keys(this.optionSelectedObj).length)) {
      if (this.optionSelectedObj.selectedOption.value.body === 'Yes') {
        this.telemetry.edata.maxScore = '1';
        this.telemetry.edata.score = '1';
      } else if (this.optionSelectedObj.selectedOption.value.body === 'No') {
        this.telemetry.edata.maxScore = '0';
        this.telemetry.edata.score = '0';
      } else if (this.optionSelectedObj.result === true) {
        this.telemetry.edata.maxScore = '1';
        this.telemetry.edata.score = '1';
      } else if (this.optionSelectedObj.result === false) {
        this.telemetry.edata.maxScore = '0';
        this.telemetry.edata.score = '0';
      }
    }
    return this.telemetry;
  }

  previousSlideClicked(event) {
    if (event = 'previous clicked') {
      this.prevSlide();
    }
  }
  replayContent() {
    this.endPageReached = false;
    this.car.selectSlide(0);
  }

}
