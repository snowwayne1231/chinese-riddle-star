<template>
    <div id="wraped-app">
        <Tool></Tool>
        <div class="curtain" :class="{open}" @keydown.esc="onCloseCurtain($event)">
            <Question :currQuestionType="currQuestionType" :currQuestionId="currQuestionId"></Question>
        </div>
        <div class="check-ws" :class="{shch: !checked}" @click="onClickCheck">新請求 [ 第{{selectQuestionIndex+1}}題 ]</div>
        <audio id="initAudio" ref="initAudio" autoplay controls loop>
            <source src="bg.mp3" type="audio/mp3">
        </audio>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Tool from './Tool.vue'
import Question from './Question.vue'

export default {
    name: 'App',
    data() {
        return {
            currQuestionType: '',
            currQuestionId: 0,
        }
    },
    computed: {
        ...mapState(['open', 'checked', 'selectQuestionIndex', 'selectQuestionType']),
    },
    mounted() {
        this.$store.dispatch('wsEmitMessage', 'login');
        this.$refs.initAudio.volume = 0.1;
        // this.$refs.initAudio.play().then(() => {
        //     console.log('this: ', this);
        // }).catch(err => {
        //     console.log('err: ', err);
        // })
    },
    methods: {
        onCloseCurtain(evt) {
            this.currQuestionType = '';
            this.currQuestionId = 0;
            this.$store.commit('updateState', {open: false});
            if (this.$refs.initAudio.paused) {
                this.$refs.initAudio.play();
            }
        },
        onClickCheck() {
            this.selectQuestionType == 'MUSIC' && this.$refs.initAudio.pause();
            this.currQuestionType = this.selectQuestionType;
            this.currQuestionId = this.selectQuestionIndex;
            console.log('this.currQuestionType: ', this.currQuestionType)
            console.log('this.currQuestionId: ', this.currQuestionId)
            this.$store.commit('updateState', {open: true, checked: true});
        }
    },
    components: {Tool, Question}
}
</script>

<style lang="scss">
#wraped-app {
    overflow: hidden;
}

#initAudio {
    position: absolute;
    bottom: 0px;
    right: 0px;
    z-index: 11;
    opacity: 0;
    transition: opacity .5s linear;
    &:hover {
        opacity: 1;
    }
}

.curtain {
    position: absolute;
    top: -100%;
    left: 0%;
    z-index: 5;
    box-sizing: border-box;
    transition: top 1s ease;

    &.open {
        top: 0%;
    }
}

.check-ws {
    position: absolute;
    z-index: 10;
    left: -210px;
    bottom: 4px;
    height: 48px;
    width: 200px;
    color: #edd7b6;
    background-color: #661715;
    transition: left .5s ease;
    border-top-right-radius: 50px;
    border-bottom-right-radius: 50px;
    box-sizing: border-box;
    line-height: 48px;
    text-align: center;
    padding-right: 30px;
    cursor: pointer;
    font-size: 18px;

    &.shch {
        left: 0px;
    }
    &:hover {
        color: #fff;
    }
}




.dialog {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
    background: rgba(0,0,0,0.4);
    width: 100%;
    height: 100%;
    text-align: center;

    .dialog-box {
        padding: 2px;
        margin: 60px auto;
        background-color: #303d93b8;
        border: 4px outset #fffee8;
        width: 1080px;
        height: 620px;
        color: #fff;
        box-sizing: border-box;
        font-size: 28px;
    }

    .box-question-show {
        display: flex;
        align-items: center;
        height: 300px;
        justify-content: center;
        flex-direction: column;

        .box-title {
            display: flex;
            justify-content: center;
            align-items: center;
            flex: 1;
            max-width: 80%;
        }
        .box-attach {
            flex: 2;
        }
        img {
            max-width: 300px;
            max-height: 140px;
        }
    }
    .box-title {
        font-size: 32px;
    }

    .box-opts {
        ul {
            height: 300px;
            margin: 0px auto;
            width: 520px;
            list-style: trad-chinese-formal;
            padding: 0px;

            >li {
                border-bottom: 2px solid #fffee8;
                cursor: pointer;
                padding: 5px 20px;

                &:hover {
                    color: #edd7b6;
                    
                }
            }
        }
    }
}

</style>