/*
 * [WCV]
 * @EliF-Lee
 */

class WCV {
    constructor() {
        this.active = false
        this.surveyCount = 0
        this.userList = []
        this.resultMSG = []
    }
    
    init() {
        const wcv = document.getElementsByClassName('wcv').length
        if (wcv > 1) { return this.removeWCV() }
        if (window.location.hostname !== 'hcs.eduro.go.kr') { return alert(`'hcs.eduro.go.kr' 에서 실행해주세요.`) }
        console.log('WCV init Success')
        this.changeActiveState()
        this.createSwitch()
        this.reBuild(XMLHttpRequest.prototype.open)
    }

    removeWCV() {
        alert('이미 실행 중인 프로그램이 존재합니다.')
        const elements = document.getElementsByClassName('wcv')
        while (elements.length > 1) {
            elements[1].parentNode.removeChild(elements[1])
        }
    }

    createSwitch() {
        const css = `.wcv-wrapper { position: fixed; bottom: 0; right: 0; text-align: center; padding-bottom: 1rem; padding-right: 1rem; z-index: 9999; }
            #wcv-switch { position: absolute; appearance: none; -webkit-appearance: none; -moz-appearance: none; }
            .wcv-switch_label { position: relative; cursor: pointer; display: inline-block; width: 58px; height: 28px; background: #fff; border: 2px solid #daa; border-radius: 20px; transition: 0.2s; padding-left: 3px; }
            .wcv-switch_label:hover { background: #efefef; }
            .wcv-onf_btn { position: absolute; top: 2px; left: 3px; display: inline-block; width: 20px; height: 20px; border-radius: 20px; background: #daa; transition: 0.2s; }
            #wcv-switch:checked+.wcv-switch_label { background: #e55; border: 2px solid #e55; }
            #wcv-switch:checked+.wcv-switch_label:hover { background: #c44; }
            #wcv-switch:checked+.wcv-switch_label .wcv-onf_btn { left: 31px; background: #fff; box-shadow: 1px 2px 3px #00000020; }`
        const style = document.createElement('style')
        document.head.appendChild(style)
        style.appendChild(document.createTextNode(css))

        const wrapper = document.createElement('div')
        document.body.appendChild(wrapper)
        wrapper.className = 'wcv-wrapper'
        wrapper.innerHTML = `<input type="checkbox" id="wcv-switch" checked><label for="wcv-switch" class="wcv-switch_label"><span class="wcv-onf_btn"></span></label>`

        this.activeSwitchListener()
    }

    activeSwitchListener() {
        const switchBtn = document.getElementById('wcv-switch')
        switchBtn.addEventListener('change', () => {
            this.changeActiveState()
        })
    }

    changeActiveState() {
        this.active = !this.active
    }

    reBuild(open) {
        XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
            this.addEventListener('readystatechange', function() {
                if (wcv.active === true && this.status === 200) {
                    if (this.responseURL.endsWith('v2/selectUserGroup')) {
                        if (this.responseText.includes('userPNo')) {
                            wcv.surveyCount = JSON.parse(this.responseText).length
                        }
                    }
                    if (this.responseURL.endsWith('v2/getUserInfo')) {
                        if (this.responseText.includes('userPNo')) {
                            const response = JSON.parse(this.responseText)
                            let isUserNew = true
                            wcv.userList.forEach(user => {
                                if (`${user.orgCode}${user.userPNo}` === `${response.orgCode}${response.userPNo}`) {
                                    isUserNew = false
                                }
                            })
                            if (isUserNew === true) {
                                wcv.userList.push(response)
                                wcv.registerServey(response)
                            }
                        }
                    }
                }
            }, false)
            open.call(this, method, url, async, user, pass)
        }
    }

    registerServey(user) {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://${user.atptOfcdcConctUrl}/registerServey`)
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        xhr.setRequestHeader('Authorization', user.token)
        xhr.withCredentials = true
        xhr.onload = function() {
            const response = JSON.parse(this.responseText)
            const isOK = response.registerDtm !== undefined
            wcv.resultMSG.push(`[ ${user.userName} | ${user.orgName} ]\n${isOK ? `- 제출완료 (${response.registerDtm})` : '- 제출실패'}`)
            if (wcv.surveyCount === wcv.resultMSG.length) {
                location.href = '#/loginWithUserInfo'
                setTimeout(() => {
                    location.href = '#/main'
                }, 100)
                alert(`[ 자가진단 제출 현황 ]\n\n${wcv.resultMSG.join('\n\n')}`)
            }
        }
        xhr.send(JSON.stringify({ 
            rspns00: 'Y',
            rspns01: '1',
            rspns02: '1',
            rspns08: '0',
            rspns09: '0',
            upperToken: user.token,
            upperUserNameEncpt: user.userName
        }))
    }
}

const wcv = new WCV()
