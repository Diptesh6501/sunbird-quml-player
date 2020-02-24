import { Component, OnInit, Input, SecurityContext, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { katex } from 'katex';
import { questionData } from './data';

declare var katex: any;

@Component({
  selector: 'quml-mcq',
  templateUrl: './mcq.component.html',
  styleUrls: ['./mcq.component.css', '../quml-library.component.css'],

})
export class McqComponent implements OnInit, AfterViewInit {


  @Input() public questions?: any;
  @Input() identifier: any;
  mcqQuestion: any;
  options: any;
  mcqOptions: any[] = [];
  isExpanded: boolean = true;
  @Input() public layout?: string;
  @Output() componentLoaded = new EventEmitter<any>();
  @Output() answerChanged = new EventEmitter<any>();
  elementRefer: any;
  @ViewChild('question') questionTag: any;
  @Output() optionSelected = new EventEmitter<number>();

  constructor(public domSanitizer: DomSanitizer,
    elementRef: ElementRef) {
    this.elementRefer = elementRef;
  }

  ngOnInit() {

    this.componentLoaded.emit({ event: 'mcq component has been loaded' });
    this.renderLatex();
    this.questions = this.questions ? this.questions : questionData;
    this.layout = this.layout ? this.layout : 'new';
    if (this.questions['__cdata'] != null) {
      const parsedQuestions = JSON.parse(this.questions.__cdata);
      this.mcqQuestion = this.domSanitizer.sanitize(SecurityContext.HTML,
        this.domSanitizer.bypassSecurityTrustHtml(parsedQuestions.question));
      this.options = parsedQuestions.options;

    } else {
      this.mcqQuestion = this.domSanitizer.sanitize(SecurityContext.HTML,
        this.domSanitizer.bypassSecurityTrustHtml(this.questions.result.assessment_item.question));
      this.options = this.questions.result.assessment_item.options;
    }
    for (let j = 0; j < this.options.length; j++) {
      const option = this.options[j];
      const optionValue = option.value.body;
      const optionHtml = this.domSanitizer.sanitize(SecurityContext.HTML, this.domSanitizer.bypassSecurityTrustHtml(optionValue));
      const selected = false;
      const optionToBePushed: any = {};
      optionToBePushed.index = j;
      optionToBePushed.optionHtml = optionHtml;
      optionToBePushed.selected = selected;
      this.mcqOptions.push(optionToBePushed);
    }
  }

  ngAfterViewInit() {
    const el = document.getElementsByClassName('mcq-options');
    el[0].remove();
  }

  renderLatex() {
    const _instance = this;
    setTimeout(function () {
      _instance.replaceLatexText();
    }, 0);
  }

  replaceLatexText() {
    const questionElement = document.getElementById(this.identifier);
    const mathTextDivs = questionElement.getElementsByClassName('mathText');
    for (let i = 0; i < mathTextDivs.length; i++) {
      const mathExp = mathTextDivs[i];
      const textToRender = mathExp.innerHTML;
      katex.render(textToRender, mathExp, { displayMode: false, output: 'html', throwOnError: true });
    }
  }
  toggleCollapse() {
    this.isExpanded = !this.isExpanded;
  }
  onOptionSelect(event, mcqOption) {
    const parsedQuestion = JSON.parse(this.questions.__cdata);
    this.answerChanged.emit({ event: 'Option has been changed' });
    this.mcqOptions.forEach(mcqOptionElement => {
      if (mcqOptionElement.index === mcqOption.index) {
        mcqOptionElement.selected = true;
      } else {
        mcqOptionElement.selected = false;
      }
    });
    parsedQuestion.options.forEach((element) => {
      if (element.value.body === mcqOption.optionHtml) {
        const selectedOption = {
          selectedOption: element,
          result: element.answer
        };
        this.getSelectedOptionAndResult(selectedOption);
      }
    });
  }

  getSelectedOptionAndResult(optionObj) {
    this.optionSelected.emit(optionObj);
  }

  switchLayout(stripData) {
    this.layout = stripData.text;
    this.renderLatex();
  }

}
