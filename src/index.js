import Styles from '@/style/main.scss';

import { createApp  } from "vue";
import { createStore } from 'vuex'
// import * as VueRouter from "vue-router";
import App from "@/vuetemp/app.vue";
// import * as Vue from 'vue'

import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';

const location = '172.16.20.73';
const socket = socketio(`http://${location}:21223/`);
const socketPlugin = createSocketIoPlugin(socket, {
    onPrefix: 'wsOn',
    emitPrefix: 'wsEmit',
});
const store = createStore({
    state () {
      return {
        open: false,
        checked: true,
        selectQuestionIndex: -1,
        selectQuestionType: '',
        questionMap: {},
        lastMsg: {}
      }
    },
    mutations: {
        wsOnMessage (state, msg) {
            // console.log('state: ', state);
            console.log('wsOnMessage msg: ', msg);
            const qtype = msg.type;
            const qidx = msg.qidx;
            if (qtype && state.questionMap[qtype] && state.questionMap[qtype][qidx]) {
                if (state.checked || !state.open) {
                    state.selectQuestionIndex = qidx;
                    state.selectQuestionType = qtype;
                    state.checked = false;
                }
            }
            state.lastMsg = msg;
        },
        updateState (state, parameter) {
            Object.keys(parameter).map(key => {
                if (state.hasOwnProperty(key)) {
                    state[key] = parameter[key];
                }
            })
        },
    },
    actions: {
        wsEmitMessage () {

        }
    },
    plugins: [socketPlugin]
})
  

const app = createApp(App);
app.use(store)
app.mount("#app");
