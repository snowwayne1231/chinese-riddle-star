<template>
  <div class="tool-page">
    <div>
      <div class="choice-zone">
        <div class="vs-block" v-for="(item, idx) in vsList">
          <div
            class="vs-user-area"
            :class="[item.name == '武將' ? 'no-one' : 'has-one']"
          >
            <img
              class="img"
              :src="getUserImgUrl(item)"
            />
            <div class="user-name">
              {{ item.name }}
            </div>
          </div>
          <div>
            <div
              class="country-name"
              :style="{
                color: item.countryColor[0],
                'text-shadow': '2px 2px 2px ' + item.countryColor[1]
              }"
            >
              {{ item.countryName }}
            </div>
            <div
              class="country-name-bg"
              :style="{
                background: item.countryColor[0]
              }"
            ></div>
            <div class="gift-zone">
              <div v-for="(gif, idx) in (userGiftMap[item.code] || [])" class="gift-number-block" :class="{show: item.name != '武將'}" :key="item.code+idx">
                <span class="icon-gift">🎁</span><span class="gift-number">{{ gif }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="list">
        <div
          v-for="(item, index) in list"
          :key="index"
          class="img-area"
          :class="{
            active: item.disable,
            selected: animationSelectedCode == item.code
          }"
        >
          <div class="show-block-img">
            <img
              class="un-img"
              :aspect-ratio="9 / 12"
              style="top: -30px"
              :src="getUserImgUrl(item)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tool',

  data() {
    return {
      roleMapObj: {
        1: '_1',
        2: '',
        3: '_0'
      },
      occupationIdMapObj: {
        1: '_2',
        2: '_2',
        3: '_3',
        4: '_3',
        5: '_3',
        6: '_3',
        7: '_3',
        8: '_3',
        9: '_4'
      },
      defaultVsObj: {
        code: 'R000',
        role: 2,
        name: '武將',
        occupationId: 0,
        countryName: '國家',
        countryColor: ['#A1A1A1', '#FFF']
      },
      // list:人選清單
      list: [],
      // vsList: 對抗清單
      vsList: [],
      animationSelectedCode: '',
      gifts: [],
      userGiftMap: {},
      specialCodes: ['R343', 'R064', 'R008', 'R026', 'R069', 'R179', 'R297'],
      results: []
    }
  },

  computed: {
    finished() {
      return this.results.length * 4 === this.list.length
    },
    enableList() {
      return this.list.filter((e) => !e.disable)
    },
    listObj() {
      return this.list.reduce(function (target, key, index) {
        target[key.code] = key
        return target
      }, {})
    }
  },

  mounted() {
    fetch('/joinlist.json')
      .then((res) => res.json())
      .then((data) => {
        const userMap = {}
        data[1].map((user) => {
          user.countryColor = user.countryColor.split(',')
          user.disable = false
          user.userImageDone = true
          userMap[user.code] = user
        })
        this.list = data[0]
          .map((item) => {
            return userMap[item.code]
          })
          .filter((e) => !!e)
        console.log('people list: ', this.list)
        this.resetGifts()
        this.resetVsList()
        this.bindKeyboardEvent()
        this.load()
      })
  },

  methods: {
    resetGifts() {
      this.userGiftMap = {}
      this.gifts = new Array(this.list.length + 7).fill(0).map((val, idx) => idx +1);
    },
    resetVsList() {
      this.vsList = new Array(4).fill(this.defaultVsObj)
    },
    getUserImgUrl(user) {
      const useUserKey = user.occupationId > 0 ? 'occupationId' : 'role'
      const mapObj = this[useUserKey + 'MapObj']
      return 'http://172.16.20.73:20221/welfare22/images/user/' + user.code + mapObj[user[useUserKey]] + '.png'
    },
    onKeyboard(evt) {
      console.log('enter key: ', evt.key)
      switch (evt.key) {
        case 'Enter':
          this.goNext()
          break
        case 'd':
          window.confirm('移除當前結果嗎?') && this.delete()
          break
        case 'r':
          if (window.confirm('重選玩家嗎?')) {
            this.reRandomAgain()
          }
          break
        // case 'Control':
        //   this.download()
        //   break
        default:
      }
    },
    bindKeyboardEvent() {
      if (window.binded) {
        return
      }
      window.binded = true
      document.addEventListener('keydown', this.onKeyboard)
    },
    goNext() {
      if (this.tmpLock) {
        return
      }
      this.tmpLock = true
      const vs = this.vsList
      if (vs.filter((e) => e.code == 'R000').length == 0) {
        // 確認滿
        if (window.confirm('重新選取嗎?')) {
          this.results.push(vs.map((e) => e.code))
          this.save()
          this.resetVsList()
          this.$store.commit('updateState', {open: false});
        }
        this.tmpLock = false
      } else {
        // 需要隨機
        const ridx = vs.findIndex(e => e.code == 'R000')
        this.randCode(ridx).then(() => {
          this.tmpLock = false
        })
      }
    },
    randGiftByCode(code) {
      const randGiftIdx = Math.floor(Math.random() * this.gifts.length)
      const giftNum = this.gifts.splice(randGiftIdx, 1);
      if (this.userGiftMap[code]) {
        this.userGiftMap[code] = this.userGiftMap[code].concat(giftNum);
      } else {
        this.userGiftMap[code] = giftNum;
      }
    },
    randCode(idx) {
      console.log('randCode left gifts: ', this.gifts);
      return this.enableList.length == 0
        ? new Promise(() => true)
        : this.animationResult()
            .then((code) => {
              console.log('animationResult: ', code)
              const nextItem = this.list.find((e) => e.code == code)
              this.randGiftByCode(code);
              if (this.specialCodes.includes(code)) {
                this.randGiftByCode(code);
              }
              
              if (idx >= 0 && this.vsList[idx]) {
                const nextVsList = this.vsList.slice();
                nextItem.disable = true;
                nextVsList[idx] = nextItem;
                this.vsList = nextVsList;
                this.list = this.list.slice()
              }              
              return code
            })
            .catch((err) => {
              console.log('err: ', err)
            })
    },
    reRandomAgain(idx = -1) {
      let handleIndex = idx;
      if (idx == -1) {
        let findedIdx = this.vsList.findIndex(e => e.code == 'R000');
        handleIndex = findedIdx == -1 ? 3 : (findedIdx-1)
      }
      const oldCode = this.vsList[handleIndex].code
      return this.randCode(handleIndex).then(() => {
        const _item = this.list.find((e) => e.code == oldCode)
        _item.disable = false
        this.userGiftMap[oldCode].map(gift => {
          this.gifts.push(gift);
        });
        delete this.userGiftMap[oldCode];
        this.list = this.list.slice()
      })
    },
    animationResult() {
      return new Promise(this.aniLoop)
    },
    aniLoop(resolve, reject) {
      const _list = this.enableList
      let times = 32
      let randCode = ''
      const loopFn = () => {
        let go = true
        if (times <= 24) {
          go = times % 2 == 0
        } else if (times <= 10) {
          go = times % 5 == 0
        }
        if (go) {
          randCode = _list[Math.floor(Math.random() * _list.length)].code
          this.animationSelectedCode = randCode
        }
        if (times <= 0) {
          window.clearInterval(_timer)
          resolve(randCode)
        }
        times -= 1
      }
      const _timer = window.setInterval(loopFn, 100)
    },
    save() {
      const vsResults = this.results;
      const giftmap = this.userGiftMap;
      localStorage.setItem('__event12__result__', JSON.stringify(vsResults))
      localStorage.setItem('__event12__giftmap__', JSON.stringify(giftmap))
    },
    load() {
      const resultstr = localStorage.getItem('__event12__result__')
      const giftmapstr = localStorage.getItem('__event12__giftmap__')
      if (resultstr) {
        const _ary = JSON.parse(resultstr)
        if (typeof _ary == 'object' && Array.isArray(_ary)) {
          this.results = _ary
          const codes = this.list.map((e) => e.code)
          const nextList = this.list.slice()
          _ary.map((vs) => {
            vs.map((_) => {
              const cidx = codes.indexOf(_)
              if (cidx >= 0) nextList[cidx].disable = true
            })
          })
          this.list = nextList
        }
      }
      if (giftmapstr) {
        const _map = JSON.parse(giftmapstr);
        const nextGifts = this.gifts.slice();
        Object.values(_map).map(gnums => {
          gnums.map(gnum => {
            let idx = nextGifts.indexOf(gnum);
            if (idx >= 0) {
              nextGifts.splice(idx, 1);
            }
          });
        });
        this.gifts = nextGifts;
        this.userGiftMap = _map;;
      }
    },
    delete() {
      this.results = []
      this.list.map((e) => {
        e.disable = false
      })
      this.list = this.list.slice()
      this.resetVsList()
      this.resetGifts()
      localStorage.removeItem('__event12__result__')
      localStorage.removeItem('__event12__giftmap__')
    },
    download() {
      let csvContent = 'data:text/csv;charset=utf-8,'
      const listMap = {}
      this.list.map((e) => {
        listMap[e.code] = e
      })
      this.results.forEach((ary) => {
        let vsNames = ary.map(code => `${code} [${listMap[code].name}]`);
        let row = vsNames.join(',');
        csvContent += row + '\r\n'
      })
      // const universalBOM = '\uFEFF'
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'event9_match.csv')
      document.body.appendChild(link)
      link.click()
    }
  }
}
</script>

<style lang="scss">
.tool-page {
  width: 100vw;
  height: 100vh;
  background: url('/public/menu_bg.jpg') center center no-repeat;
  background-size: cover;

  .choice-zone {
    border-bottom: 2px solid #958640;
    text-align: center;
  }
  .list {
    width: 100%;
    padding: 1px;
    text-align: center;
  }
  .img-area {
    position: relative;
    border: 2px outset #777777;
    border-radius: 3px;
    box-sizing: border-box;
    display: inline-block;
    margin: 2px;
    height: 106px;

    &.active {
      .show-block-img {
        filter: opacity(0.3);
        border-color: #d8b585;
        border-width: 4px;
      }
    }
    &.selected {
      &::after {
        content: '';
        display: block;
        position: absolute;
        left: -5px;
        top: -5px;
        border: 5px solid #f82e27;
        box-shadow: 0 0 3px #f82e27;
        width: 100%;
        height: 100%;
      }
    }
    .show-block-img {
      width: 100%;
      height: 100%;
      overflow: hidden;
      text-align: center;
      background: #fff;
      box-sizing: border-box;
      border: 1px outset #777777;
    }
    img {
      max-width: 100%;
      max-height: 100%;
    }
    
  }

  .vs-block {
    position: relative;
    width: 25%;
    height: 300px;
    background: #00000086;
    overflow: hidden;
    font-family: '華康行楷體W5';
    border-radius: 15px;
    box-sizing: border-box;
    text-align: center;
    display: inline-block;
    border: 3px outset #ffeac4;

    .vs-user-area {
      position: relative;

      &.no-one {
        .img {
          filter: drop-shadow(5px 0 #ccc) !important;
          transform: translateX(0px) !important;
        }
      }
      &.has-one {
        .img {
          animation: 1s zoominimg ease;
        }
      }
      .user-name {
        white-space: nowrap;
        position: absolute;
        z-index: 3;
        bottom: 28%;
        color: #fff;
        right: 80%;
        font-size: 52px;
        writing-mode: vertical-lr;
        text-shadow: 5px 5px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }
    }
    .country-name {
      position: absolute;
      bottom: 0;
      z-index: 0;
      font-size: 48px;
      width: 30%;
      right: 0;
      text-align: right;
      padding-right: 2%;
      transition: color 1s ease;
    }
    .country-name-bg {
      position: absolute;
      top: 0;
      z-index: 1;
      height: 100%;
      width: 100%;
      clip-path: polygon(100% 45%, 0% 100%, 100% 100%);
      right: 0;
      text-align: right;
      opacity: 0.5;
      transition: background 1s ease;
    }
    .img {
      position: relative;
      z-index: 2;
      max-height: 320px;
      
    }
    .gift-zone {
      position: absolute;
      top: 0px;
      right: 0px;
      z-index: 5;

      .icon-gift {
        position: absolute;
        top: -18px;
        left: -26px;
        font-size: 30px;
        text-shadow: 2px 1px 3px #222;
        transition: left 1s ease;
      }
    }
    .gift-number-block {
      position: relative;
      background: #f82e2700;
      width: 76px;
      height: 76px;
      line-height: 76px;
      border-radius: 50%;
      animation: 2s bgtrans1 ease;

      &.show {
        background: #d71b14ff;
        border: 3px #d8b585 outset;

        .gift-number {
          animation: 2s fontnumberrolling ease;
        }

      }

      .gift-number {
        display: inline-block;
        font-size: 60px;
        color :#fff;
        text-shadow: 1px 1px 2px #222;

      }
    }
  }
}

@keyframes zoominimg {
  0% {
    max-height: 600px;
  }

  90% {
    max-height: 300px;
  }

  100% {
    max-height: 320px;
  }
}

@keyframes bgtrans1 {
  0% {
    background: #f82e2700;
  }
  100% {
    background: #d71b14ff;
  }
}

@keyframes fontnumberrolling {
  0% {
    transform: rotate(0deg);
    font-size: 240px;
  }

  // 50% {
  //   transform: rotate(360deg);
  //   font-size: 52px;
  // }

  100% {
    transform: rotate(720deg);
    font-size: 60px;
  }
}
</style>