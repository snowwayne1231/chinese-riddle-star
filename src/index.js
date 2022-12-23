import Styles from '@/style/main.scss';

import { createApp  } from "vue";
import { createStore } from 'vuex'
// import * as VueRouter from "vue-router";
import App from "@/vuetemp/app.vue";
// import * as Vue from 'vue'

import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';

const location = '172.16.20.73';
// const location = '127.0.0.1';
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
        authorized: false,
        lastMsg: {},

        randomPeopleList: [],
        vsList: [],
        userGiftMap: {},
        gifts: [],

        actionKey: '',
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
            else if (qtype == 'data') {
                console.log('recv data: ', msg.data);
                const data = msg.data;
                Object.keys(data).map(key => {
                    if (state.hasOwnProperty(key)) {
                        state[key] = data[key];
                    }
                });
            }
            else if (qtype == 'authorized') {
                state.authorized = true;
            }
            else if (qtype == 'action') {
                if ( !state.authorized) state.actionKey = msg.act;
                if (msg.act == 'openQuestion') {
                    state.open = true;
                } else if (msg.act == 'closeQuestion') {
                    state.open = false;
                }
            }
            state.lastMsg = msg;
        },
        updateState (state, parameter) {
            Object.keys(parameter).map(key => {
                if (state.hasOwnProperty(key)) {
                    state[key] = parameter[key];
                }
            });
        },
    },
    actions: {
        wsEmitMessage (context) {

        },
        updateStateAct (context, parameter) {
            context.commit('updateState', parameter);
            if (context.state.authorized) {
                context.dispatch('wsEmitMessage', {
                    order: 'save',
                    data: {
                        vsList: context.state.vsList,
                        userGiftMap: context.state.userGiftMap,
                        gifts: context.state.gifts,
                        randomPeopleList: context.state.randomPeopleList
                    }
                });
            }
        },
        makeAction (context, act) {
            context.dispatch('wsEmitMessage', {order: 'action', act});
        }
    },
    plugins: [socketPlugin]
})
  

const app = createApp(App);
app.use(store)
app.mount("#app");
