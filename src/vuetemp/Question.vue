<template>
    <div class="question-page" tabindex="0">
        
        <audio ref="questionAudio" :src="currQuestion && currQuestion.musicFileNames[0] ? musicUrlStr + currQuestion.musicFileNames[0] : ''"></audio>
        <audio ref="answerAudio" :src="currQuestion && currQuestion.musicFileNames[1] ? musicUrlStr + currQuestion.musicFileNames[1] : ''"></audio>
        <audio ref="openAnswerSound" src="/chinese_don.mp3"></audio>

        <div class="area d-flex mb-24-px h-100-pct w-100-pct" v-if="currQuestion">
            <div class="content px-50-px align-self-center flex-grow-1 text-center">
                <div class="fz-42-px text-right pr-30-px mb-10-px" @click="onClickTestNext">
                    {{ '{' + typeTitle[currQuestion.type] + '（' + currQuestion.qnum + '）}' }}
                </div>
                <div class="q-area text-left"
                    :class="[currQuestion.textfz ? 'fz-' + currQuestion.textfz + '-px' : 'fz-65-px']">
                    <div v-if="currQuestion.imageFileName" class="img-area">
                        <img class="v-image" :src="imageUrlStr + currQuestion.imageFileName" />
                    </div>
                    <span>{{ currQuestion.text }}</span>
                    <div v-if="currQuestion.musicFileNames[0]" class="btn" @click="playQuestionMusic">
                        <div class="left-bg">
                            <div class="squre"></div>
                        </div>
                        <span>題目</span><v-icon>➤</v-icon>
                        <div class="right-bg">
                            <div class="squre"></div>
                        </div>
                    </div>
                    <div class="btn" @click="onClickAnswerBtn">
                        <div class="left-bg">
                            <div class="squre"></div>
                        </div>
                        <span>答案</span><v-icon>➤</v-icon>
                        <div class="right-bg">
                            <div class="squre"></div>
                        </div>
                    </div>
                </div>
                <div class="mt-60-px d-flex flex-wrap justify-center"
                    :class="[currQuestion.optionfz ? 'fz-' + currQuestion.optionfz + '-px' : 'fz-70-px']">
                    <span v-for="(option, index) in currQuestion.options.filter(e => e)" :key="index"
                        class="d-inlin-block px-16-px py-20-px d-flex option-area"
                        :class="openAnswer ? [index == currQuestion.answerIndex ? 'is-answer' : 'not-answer'] : null">
                        <span class="d-inlin-block align-self-start">{{ optionsLabel[index] }}、</span>
                        <span class="d-inlin-block text-left">{{ option }}</span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
    name: 'Question',
    props: {
        currQuestionType: String,   // 當前題目類別
        currQuestionId: Number,     // 當前題目ID
    },
    data() {
        return {
            openAnswerKey: '',
            // 所有題目
            list: [
                {
                    id: '1',
                    type: 'MUSIC',
                    text: '猜出是下列哪一首歌?',
                    musicFileNames: ['', ''],
                    imageFileName: '',
                    textfz: '',
                    optionfz: '',
                    options: ['吾賞八十有七(這我給87分)', '此言差矣(我覺得可以)', '乳身聳然\n(嚇死寶寶了)', '你有對子嗎?(你有FreeStyle嗎?)', '吾眼蘖深(我眼睛業障重)']
                }
            ],
            // 題目音樂檔案位置
            musicUrlStr: '/',
            // 題目圖片檔案位置
            imageUrlStr: '/',
            // 背景音樂檔名
            // 當前播放題目音樂路徑
            musicUrl: '',
            // 當前播放題目音樂 0: 題目 1:答案
            currQuestionMusicIndex: -1,
            // 題目出處
            datasetQuestions: '/questions.csv',

            optionsLabel: ['一', '二', '三', '四', '五'],
            typeTitle: {
                LANGUAGE: '語文題',
                MUSIC: '音律題',
                GEOGRAPHY: '地理題',
                HISTORY: '歷史題'
            }
        }
    },

    computed: {
        ...mapState(['actionKey', 'authorized']),
        currQuestion() {
            const _ = this.list.find((item) => {
                return item.id == this.currQuestionId && item.type == this.currQuestionType
            })
            console.log('currQuestion', _);
            return _
        },
        openAnswer() {
            return this.openAnswerKey == `${this.currQuestionType}_${this.currQuestionId}`;
        },
    },

    watch: {
        actionKey(val) {
            if (val == 'clickAnswer') {
                this.$store.commit('updateState', {actionKey: ''});
                this.onClickAnswerBtn();
            }
        }
    },

    mounted() {
        const $self = this;
        fetch($self.datasetQuestions).then((res) => res.text()).then((data) => {
            // console.log(data);
            const questionMap = {}
            const lines = data.split(/\r\n\,/g)
            const matrix = lines.map(item => {
                return item.split(',');
            });
            const columns = matrix[1].map(e => e.replace(/[\W\d]+$/g, ''));
            const ansToIndexMap = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4};
            const objectList = matrix.slice(2).map(e => {
                const _ = {}
                for (let i = 0; i < e.length; i++) {
                    let key = columns[i];
                    let val = e[i];
                    _[key] = _.hasOwnProperty(key) ? [].concat(_[key], val) : val;
                }
                if (!questionMap[_.type]) {
                    questionMap[_.type] = [];
                }
                _.id = questionMap[_.type].length;
                _.answerIndex = ansToIndexMap[_.answer];
                questionMap[_.type].push(_);
                return _;
            });
            // console.log('matrix: ', matrix);
            // console.log('objectList: ', objectList);
            // console.log('questionMap: ', questionMap);
            $self.$store.commit('updateState', {questionMap});
            $self.list = objectList;
        });
        this.$refs.openAnswerSound.volume = 0.25;
    },

    methods: {
        playQuestionMusic() {
            this.$refs.questionAudio.play()
        },
        onClickAnswerBtn() {
            if (this.authorized) {
                this.$store.dispatch('makeAction', 'clickAnswer');
                const music = this.currQuestion.musicFileNames[1];
                if (music) {
                    if (this.$refs.answerAudio.paused) {
                        this.$refs.answerAudio.play()
                    } else {
                        this.$refs.answerAudio.pause()
                    }
                } else if (!this.openAnswer) {
                    this.$refs.openAnswerSound.play();
                }
            }
            this.openAnswerKey = `${this.currQuestionType}_${this.currQuestionId}`;
        },
        onClickTestNext() {
            if (this.currQuestionId >= 14) {
                const _keys = Object.keys(this.typeTitle);
                const _findedIdx = _keys.findIndex(e => e == this.currQuestionType);
                const selectQuestionType = (_findedIdx >= 3) ? _keys[0] : _keys[_findedIdx+1];
                this.$store.commit('updateState', {selectQuestionIndex: 0, selectQuestionType, checked: false});
            } else {
                this.$store.commit('updateState', {selectQuestionIndex: this.currQuestionId+1, checked: false});
            }
        }
    }


}
</script>

<style lang="scss">
.title-area {
    font-size: 40px;
    color: #f9b552;
    font-family: '華康行楷體W5' !important;
    margin-bottom: 40px;

    ._title {
        position: relative;
        font-size: 80px;
        line-height: 80px;
    }
}

.topic-area {
    font-size: 100px;
    color: #fcca43;
    font-family: '華康行楷體W5' !important;

    .sub-topic {
        font-size: 40px;
        background: #fcca43;
        color: #a51212;
        padding: 10px 30px;
        margin-bottom: 0px;
        text-shadow: none;
        border-top-left-radius: 15px;
        border-bottom-right-radius: 15px;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            top: 5px;
            left: 5px;
            width: calc(100% - 10px);
            height: calc(100% - 10px);
            border-top-left-radius: 15px;
            border-bottom-right-radius: 15px;
            border: 1px solid #cf977b;
        }
    }

    .topic {
        letter-spacing: 10px;
        padding-left: 10px;
        line-height: 64px;
    }
}

.flex-grow-1 {
    flex-grow: 1 !important;
}

.align-self-center {
    align-self: center !important;
}

.d-flex {
    display: flex !important;
}

.d-inline-block {
    display: inline-block !important;
}

.text-left {
    text-align: left;
}

.text-right {
    text-align: right;
}

.text-center {
    text-align: center;
}


@for $i from 0 through 100 {
    .fz-#{$i}-px {
        font-size: #{$i}px !important;
        line-height: #{$i + 6}px !important;
    }

    .w-#{$i}-pct {
        width: #{$i}+'%' !important;
    }

    .h-#{$i}-pct {
        height: #{$i}+'%' !important;
    }

    .w-#{$i}-px {
        width: #{$i}+'px' !important;
    }

    .h-#{$i}-px {
        height: #{$i}+'px' !important;
    }

    .py-#{$i}-px {
        padding-top: #{$i}px !important;
        padding-bottom: #{$i}px !important;
    }

    .px-#{$i}-px {
        padding-left: #{$i}px !important;
        padding-right: #{$i}px !important;
    }

    .pr-#{$i}-px {
        padding-right: #{$i}px !important;
    }

    .mt-#{$i}-px {
        margin-top: #{$i}px !important;
    }

    .mb-#{$i}-px {
        margin-bottom: #{$i}px !important;
    }

}

.question-page {
    background: url('/public/bg_red.jpg') center center no-repeat;
    background-size: cover;
    width: 100vw;
    height: 100vh;
    text-shadow: 0.1em 0.1em rgb(43, 18, 18);
    font-family: 'DFKai-sb';
    white-space: pre-line;
    color: #FFF !important;
    position: relative;

    &::before {
        content: '';
        background-color: #111;
        opacity: 0.2;
        width: 100vw;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
    }

    $btnW: 150px;
    $btnH: 46px;
    $btnC: #f9b552;
    $borderR: 5px;

    .img-area {
        text-align: center;
        display: inline-block;
        vertical-align: middle;
        margin-right: 30px;

        .v-image {
            margin: 0 auto;
            max-height: 350px;;
        }
    }

    .btn {
        display: inline-block;
        position: relative;
        width: $btnW;
        height: $btnH;
        line-height: $btnH;
        margin: 0 15px;
        padding: 0 6px 0 10px;
        color: #fff;
        background: $btnC;
        border: 1px solid $btnC;
        box-sizing: border-box;
        text-align: center;
        font-size: 25px;
        letter-spacing: 10px;
        border-radius: $borderR;
        text-shadow: none;
        opacity: 0.85;
        margin-left: 40px;
        cursor: pointer;
        box-shadow: 0 2px 1px -1px rgba(0, 0, 0, .2), 0 1px 1px 0 rgba(0, 0, 0, .14), 0 1px 3px 0 rgba(0, 0, 0, .12) !important;

        &::after {
            display: block;
            position: absolute;
            top: 3px;
            left: 4px;
            width: calc(#{$btnW} - 9px);
            height: calc(#{$btnH} - 8px);
            content: '';
            border-radius: $borderR;
            border: 1px solid rgba(255, 255, 255, 0.7);
            box-sizing: border-box;
        }

        &:hover {
            opacity: 1;
            box-shadow: 0 6px 7px -4px rgba(0, 0, 0, .2), 0 11px 15px 1px rgba(0, 0, 0, .14), 0 4px 20px 3px rgba(0, 0, 0, .12) !important;
        }

        &:active {
            opacity: 1;
            box-shadow: 0 2px 1px -1px rgba(0, 0, 0, .2), 0 1px 1px 0 rgba(0, 0, 0, .14), 0 1px 3px 0 rgba(0, 0, 0, .12) !important;
        }

        &:last-child {
            float: right;
        }

        .v-icon {
            vertical-align: text-bottom;
        }
    }

    // 94 33
    $bgTopHelf: calc(#{$btnH} - 13px)/2;

    .left-bg,
    .right-bg {
        display: block;
        position: absolute;
        top: calc(50% - #{$bgTopHelf});
        left: -7px;
        width: 8px;
        height: calc(#{$btnH} - 13px);
        border-radius: 0;
        background: $btnC;
        border-radius: $borderR;

        &::after {
            display: block;
            position: absolute;
            top: 3px;
            left: 4px;
            width: 9px;
            height: calc(#{$btnH} - 19px);
            content: '';
            background: $btnC;
            border: 1px solid;
            border-color: rgba(255, 255, 255, 0.7) transparent rgba(255, 255, 255, 0.7) rgba(255, 255, 255, 0.7);
            box-sizing: border-box;
            z-index: 9;
            border-radius: $borderR;
        }
    }

    .right-bg {
        left: auto;
        right: -7px;

        &::after {
            left: auto;
            right: 4px;
            border-color: rgba(255, 255, 255, 0.7) rgba(255, 255, 255, 0.7) rgba(255, 255, 255, 0.7) transparent;
        }
    }

    .squre,
    .squre:after {
        position: absolute;
        left: 11px;
        top: 3px;
        width: 3px;
        height: 3px;
        /* background: rgba(255,255,255,0.7); */
        border: 1px solid rgba(255, 255, 255, 0.7);
        z-index: 99;
        box-sizing: border-box;
    }


    .squre:after {
        left: -1px;
        top: auto;
        bottom: -25px;
        content: '';
    }

    .right-bg .squre,
    .right-bg .squre:after {
        left: auto;
        right: 10px;
    }

    .right-bg .squre:after {
        right: -1px;
    }

    .area {
        position: relative;
        z-index: 1;

        .content {
            position: relative;
            top: -5%;
        }
    }

    .q-area {
        position: relative;
        border: 3px solid rgb(214, 164, 55);
        border-radius: 10px;
        background: #034465c9;
        padding: 30px 60px;
    }

    .option-area {
        width: calc(20% - 12px);
        margin: 0 6px;
        border: 3px solid rgb(214, 164, 55);
        border-radius: 10px;
        background: #034465c9;
        transition-property: all;
        transition-duration: 1s;
        transition-timing-function: ease;
        opacity: 1;

        &.is-answer {
            background-color: #072230;
            color: #fcca43;
        }
        &.not-answer {
            opacity: 0.2;
            // margin-top: 6px;
        }
    }
}

.h-100-vh {
    height: 100vh;
}

</style>