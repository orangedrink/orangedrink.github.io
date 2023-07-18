    String.prototype.replaceAt = function(index, replacement) {
        return this.substring(0, index) + replacement + this.substring(index + replacement.length);
    }

    kaboom({
        global: true,
        fullscreen: true,
        scale: 2,
        debug: true,
        background: [33, 33, 33, 1],
    })
    //globals
    let dialogOpen = false;
    let keystate
    let gamestate = JSON.parse(localStorage.getItem("gameState"));
    if(!gamestate){
        gamestate = {
            mmFound: false,
            bit1: false,
            bit2: false,
            bit3: false,
            bit4: false,
            tears:0,
            breakerSet:0,
            spellKey:'kapow',
        }
    }
    const saveState = function(){
        const s = JSON.stringify(gamestate);
        localStorage.setItem("gameState", s);
    }
    // Constants
    const MOVE_SPEED = 120
    const camTween = function(p, steps){
        var step = 0;
        var camInterval = setInterval(function(){
            step++;
            if(step>steps) clearInterval(camInterval)
            var currCam = camPos();
            var xmov = (p.x - currCam.x) / (steps-step);
            var ymov = (p.y - currCam.y) / (steps-step);
            if(Math.round(p.y)!=Math.round(currCam.y)){
                currCam.y+=ymov;
            }
            if(Math.round(p.x)!=Math.round(currCam.x)){
                currCam.x+=xmov;
            }
            camPos(currCam)
        },1)

    }
    const dialog = function(message, player, p, choices, callback){
        dialogOpen = true
        camTween(p, 6)
        //camPos(player.pos.x, player.pos.y)
        const b = add([
            sprite('dialog'),
            origin('center'),
            pos(p.x, p.y),
        ])

        const t = []
        let selected = 0;
        let cursor
        t.push(add([
            text(message,{
                size: 12,
                width:300
            }),
            pos(p.x, p.y-(choices&&choices.length?40:8)),
            origin('center')
        ]))
        if(choices&&choices.length){
            cursor = add([
                text('>>>',
                {
                    size: 12,
                    width:300
                }),
                pos(p.x-70, p.y+(28+(12*selected))),
                origin('center')
            ])
            t.push(cursor)
            t.push(add([
                text('Use the arrow keys and space to select.',{
                    size: 12,
                    width:300
                }),
                pos(p.x, p.y+100),
                origin('center')
            ]))
            choices.forEach((choice, i)=>{
                t.push(add([
                    text(choice ,{
                        size: 12,
                        width:300
                    }),
                    pos(p.x, p.y+(28+(12*i))),
                    origin('center')
                ]))
            })
        } else{
            t.push(add([
                text('Press space to continue',{
                    size: 12,
                    width:300
                }),
                pos(p.x, p.y+100),
                origin('center')
            ]))                
        }
        wait(.5,()=>{
            keystate=''
            let keyInterval = setInterval(()=>{
                if(cursor){
                    cursor.moveTo(p.x-70, p.y+(28+(12*selected)))
                }
                if(keystate == 'down'){
                    keystate =''
                    selected++
                    if(choices && selected == choices.length){
                        selected = 0
                    }
                }else if(keystate == 'up'){
                    keystate =''
                    selected--
                    if(selected < 0 && choices){
                        selected = choices.length-1
                    }
                }else if(keystate == 'space'){
                    keystate =''
                    clearInterval(keyInterval)
                    destroy(b)
                    t.forEach(t=>{
                        destroy(t)
                    })
                    player.play('Idle')
                    wait(.1,()=>{
                        dialogOpen = false
                        if(callback) callback(selected)
                    })
                } else {
                }
            }, 1)    
        })
    }
    let cardExists = false;
    const card = function(message, player, p, choices, callback){
        cardExists = true;
        let t = add([
            text(message,{
                size: 12,
                width:300
            }),
            pos(p.x, p.y-(choices&&choices.length?40:8)),
            area(),
        ])
    }
    const spellMapping = {
        'kapow': {velocity: 10, size: 1, range: 32, sprite: 'explosion'},
        'kaboom': {velocity: 20, size: 1.75, range: 48, sprite: 'explosion'},
        'lightningstrike': {velocity: 30, size: 1, range: 48, sprite: 'lightningstrike', lifespan: .5},
        'lightningstorm': {velocity: 50, size: 1.25, range: 48, sprite: 'lightningstorm', lifespan: 1},
        'fireball': {velocity: 180, size: 1.25, range: 28, sprite: 'fireball', expSpr: 'explosion', collide: true, lifespan: 3},
        'shadowbolt': {velocity: 260, size: 2, range: 28, sprite: 'shadowbolt', expSpr: 'shadow_explosion', collide: true, lifespan: 3},
    }
    const monsterMapping = {
        '1000' : {key:'skeleton', str: 1, con:2, dex: 3, spd: 2, size: 2,
            name:'Skeleton',
            type: 'Undead',
        },
        '0100' : {key:'boar', str: 2, con:2, dex: 2, spd: 1, size: 2,
            name:'Pigman',
            type: 'Animal',
        },
        '0010' : {key:'beast', str: 2, con:2, dex: 3, spd: 3, size: 2, 
            specials:{jumping:{lunge:true}},
            name:'Beast',
            type: 'Animal',
        },
        '1100' : {key:'mushroom', str: 2, con:2, dex: 3, spd: 3, size: 2, 
            specials:{jumping:{lunge:true, jump:true}, standing:{lunge:true}},
            name:'Fun Guy',
            type: 'Mushroom',
        },
        '1010' : {key:'troll', str: 3, con:2, dex: 2, spd: 2, size: 3, 
            specials:{standing:{pound:true}},
            name:'Troll',
            type: 'Animal',
        },
        '0110' : {key:'reaver', str: 2, con:1, dex: 3, spd: 2, size: 2, 
            specials:{jumping:{lunge:true, jump:true}},
            name:'Flesh Reaver',
            type: 'Undead',
        },
        '1110' : {key:'lizard', str: 2, con:2, dex: 3, spd: 3, size: 2, 
            specials:{standing:{attack:true}},
            name:'Lizardman',
            type: 'Animal',
        },
        //=============================================================
        //bit 4
        '0001' : {key:'elemental', str: 3, con:3, dex: 3, spd: 3, size: 2, 
            specials:{standing:{attack:true, lunge:true}},
            name:'Spirit Elemental',
            type: 'Magical',
        },
        '1001' : {key:'golem', str: 4, con:4, dex: 3, spd: 3, size: 2, 
            specials:{standing:{attack:true, lunge:true}, jumping:{lunge:true}},
            name:'Iron Golem',
            type: 'Magical',
        },
        '0101' : {key:'mushroom', str: 3, con:3, dex: 4, spd: 4, size: 3, 
            specials:{jumping:{lunge:true, jump:true}, standing:{lunge:true}},
            name:'Fun Gus',
            type: 'Mushroom',
        },
        '0011' : {key:'troll', str: 3, con:3, dex: 4, spd: 4, size: 3, 
            specials:{standing:{attack:true, lunge:true, pound:true}, jumping:{lunge:true, pound:true}},
            name:'Giant Troll',
            type: 'Animal',
        },
        '1101' : {key:'beast', str: 3, con:3, dex: 4, spd: 4, size: 3, 
            specials:{standing:{attack:true, lunge:true}, jumping:{lunge:true}},
            name:'Giant Beast',
            type: 'Animal',
        },
        '1011' : {key:'boar', str: 4, con:4, dex: 3, spd: 3, size: 3, 
            specials:{standing:{attack:true, lunge:true, pound:true}, jumping:{pound:true, lunge:true}},
            name:'Boarman',
            type: 'Animal',
        },
        '0111' : {key:'lizard', str: 4, con:4, dex: 5, spd: 5, size: 3, 
            specials:{standing:{attack:true}},
            name:'Dragonman',
            type: 'Animal',
        },
        '1111' : {key:'golem', str: 5, con:5, dex: 4, spd: 4, size: 3, 
            specials:{standing:{attack:true, lunge:true}, jumping:{lunge:true}},
            name:'Steel Golem',
            type: 'Magical',
        },

        //=============================================================
        //Special
        'bean' : {key:'bean', str: 3, con:3, dex: 5, spd: 4, size: 2, 
            specials:{jumping:{lunge:true, jump:true}, standing:{lunge:true, attack:true}},
            name:'Bean',
            type: 'Animal',
        },


    }
    //Load sounds
    loadSound("title", "assets/lady-of-the-80s.mp3")
    loadSound("house", "assets/kim-lightyear-just-a-dream-wake-up.mp3")
    //Load sprites
    loadRoot('assets/')
    loadSprite('logo', 'Logo.png')
    loadSprite('left-wall', 'wall-left.png')
    loadSprite('left-wall', 'wall-left.png')
    loadSprite('top-wall', 'wall-top.png')
    loadSprite('bottom-wall', 'wall-bottom.png')
    loadSprite('right-wall', 'wall-right.png')
    loadSprite('bottom-left-wall', 'wall-bottom-left.png')
    loadSprite('bottom-right-wall', 'wall-bottom-right.png')
    loadSprite('bottom-left-inside-wall', 'wall-inside-bottom-left.png')
    loadSprite('bottom-right-inside-wall', 'wall-inside-bottom-right.png')
    loadSprite('top-left-inside-wall', 'wall-inside-top-left.png')
    loadSprite('top-right-inside-wall', 'wall-inside-top-right.png')
    loadSprite('top-left-wall', 'wall-top-left.png')
    loadSprite('top-right-wall', 'wall-top-right.png')
    loadSprite('galley-sign', 'galley-sign.png')
    loadSprite('library-sign', 'library-sign.png')
    loadSprite('cellar-sign', 'cellar-sign.png')
    loadSprite('parlor-sign', 'parlor-sign.png')
    loadSprite('tower-sign', 'tower-sign.png')
    loadSprite('top-door', 'door.png')
    //loadSprite('explosion', 'explode.png')
    loadSprite('stairs-up', 'stairs-up.png')
    loadSprite('stairs-dn', 'stairs-dn.png')
    loadSprite('floor', 'floor.png')
    loadSprite('top-left-carpet', 'carpet-top-left.png')
    loadSprite('top-carpet', 'carpet-top.png')
    loadSprite('top-right-carpet', 'carpet-top-right.png')
    loadSprite('left-carpet', 'carpet-left.png')
    loadSprite('carpet', 'carpet.png')
    loadSprite('right-carpet', 'carpet-right.png')
    loadSprite('bottom-right-carpet', 'carpet-bottom-right.png')
    loadSprite('bottom-carpet', 'carpet-bottom.png')
    loadSprite('bottom-left-carpet', 'carpet-bottom-left.png')
    loadSprite('bed', 'bed.png')
    loadSprite('couch', 'couch.png')
    loadSprite('bed2', 'bed2.png')
    loadSprite('dialog', 'dialog.png')
    loadSprite('chair', 'chair.png')
    loadSprite('chair2', 'chair2.png')
    loadSprite('chair3', 'chair3.png')
    loadSprite('table', 'table.png')
    loadSprite('table2', 'table2.png')
    loadSprite('column', 'column.png')
    loadSprite('statue', 'statue.png')
    loadSprite('button2', 'button2.png')
    loadSprite('bookshelf', 'bookshelf.png')
    loadSprite('shelf', 'shelf.png')
    loadSprite('web', 'web.png')
    loadSprite('web2', 'web2.png')
    loadSprite('web-line', 'web-line.png')
    loadSprite('blank', 'blank.png')
    loadSprite('terrain-top-center', 'village/terrain_top_center_B_full.png')
    loadSprite('terrain-center', 'village/terrain_center.png')
    loadSprite('house', 'village/house.png')
    loadSprite('mountains_bg', 'village/bg_mountains_and_sky.png')
    loadSprite('title', 'title.jpg')
    loadAseprite("building-door", "village/building_door.png", "village/building_door.json");
    loadAseprite("doctor", "doctor.png", "doctor.json");
    loadAseprite('monmach', 'monmach.png', 'monmach.json')
    loadAseprite('tears', 'tears.png', 'tears.json')
    loadAseprite('switch', 'switch.png', 'switch.json')
    loadAseprite('button', 'button.png', 'button.json')
    loadAseprite('breaker', 'breaker.png', 'breaker.json')
    loadAseprite('ghoulie', 'ghoulies.png', 'ghoulies.json')
    loadAseprite('bone', 'bone.png', 'bone.json')
    loadAseprite('skull', 'skull.png', 'skull.json')
    loadAseprite('slime', 'slime.png', 'slime.json')
    loadAseprite('slime-drop', 'slime-drop.png', 'slime-drop.json')
    loadAseprite('spider', 'spider.png', 'spider.json')
    loadAseprite('bat', 'bat.png', 'bat.json')
    loadAseprite('explosion', 'explosion.png', 'explosion.json')
    loadAseprite('fireball', 'fireball.png', 'fireball.json')
    loadAseprite('shadowbolt', 'shadowbolt.png', 'shadowbolt.json')
    loadAseprite('lightningstrike', 'lightningstrike.png', 'lightningstrike.json')
    loadAseprite('lightningstorm', 'lightningstorm.png', 'lightningstorm.json')
    loadAseprite('steam', 'steam.png', 'steam.json')
    loadAseprite('shadow_explosion', 'shadow_explosion.png', 'shadow_explosion.json')
    loadAseprite('bean', 'monsters/bean.png', 'monsters/bean.json')
    loadAseprite('boar', 'monsters/boar.png', 'monsters/boar.json')
    loadAseprite('skeleton', 'monsters/skeleton.png', 'monsters/skeleton.json')
    loadAseprite('beast', 'monsters/beast.png', 'monsters/beast.json')
    loadAseprite('mushroom', 'monsters/mushroom.png', 'monsters/mushroom.json')
    loadAseprite('troll', 'monsters/troll.png', 'monsters/troll.json')
    loadAseprite('reaver', 'monsters/reaver.png', 'monsters/reaver.json')
    loadAseprite('lizard', 'monsters/lizard.png', 'monsters/lizard.json')
    loadAseprite('elemental', 'monsters/elemental.png', 'monsters/elemental.json')
    loadAseprite('golem', 'monsters/golem.png', 'monsters/golem.json')
    loadSprite('peasant', 'village/Peasant_Red.png', {
        sliceX: 6,
        sliceY: 9,
        anims: {
            idle:{ from: 0, to: 5, loop: true},
            walk: { from: 6, to: 11, loop: true},
            run: { from: 14, to: 20, loop: true},
            attack: {from: 21, to: 26},
            hit: {from: 36, to: 38},
            die: {from: 39, to: 53},
            
        }
    })
    loadSprite('militia', 'village/Milita_Green.png', {
        sliceX: 6,
        sliceY: 9,
        anims: {
            idle:{ from: 0, to: 5, loop: true},
            walk: { from: 6, to: 11, loop: true},
            run: { from: 14, to: 20, loop: true},
            attack: {from: 21, to: 26},
            hit: {from: 36, to: 38},
            die: {from: 39, to: 53},
            
        }
    })
    loadSprite('knight', 'village/Knight_Purple.png', {
        sliceX: 8,
        sliceY: 7,
        anims: {
            idle:{ from: 0, to: 7, loop: true},
            walk: { from: 8, to: 15, loop: true},
            run: { from: 16, to: 23, loop: true},
            attack: {from: 26, to: 29},
            hit: {from: 37, to: 38},
            die: {from: 39, to: 54},
            
        }
    })

    let hmusic// = play("house", {
    //    volume: 0.15,
    //    loop: false
    //});
    //hmusic.pause();

    scene('mansion', ({
        level,
        startX,
        startY,
        newGame,
        newGameMsg,
    }) => {
        layers(['bg', 'mg', 'fg', 'obj', 'ui'], 'obj')
        let buttonsPressed = 0
        const maps = [
            [
                'yccccw',
                'akjikb',
//                'aiiiYb',
                'aqrrsb',
                'atuuvb',
                'aABBCb',
                'xgiihz',
                ' aiib ',
                ' a2ib ',
                ' aiib ',
                ' xddz  ',
            ],
            [
                '        yccw     M       yccw',
                '        a3ib   ycccccw   a1ib',
                '        aiib   aiiiiib   aiib',
                '        aiib   aiqrsib   aiib',
                '    a>b aii=ccceituvifccceiib a<b',
                '    aib aiiiiiiiituviiiiiiiib aib', 
                '    aifc(iiiiiiiituviiiiiiii*ceib',
                '    aiiiiiiiiiiIituviIiiiiiiiiiib',
                '    xdddgiippiiIituviIiippiihdddz',
//                '        aiippiiIituviIiippiib',
//                '        aiippiiIituviIiippiib',
                'aVb     aiippiiIituviIiippiib     a^b',
                'aib     aiippiiIituviIiippiib     aib',
                'aifccccceiiiiiiiituviiiiiiii-ccccceib',
                'aiiiiiiiiiiiiiiiiABCiiiiiiiiiiiiiiiib',
                'xdddddddddddddddgiiihdddddddddddddddz',
                '                aiiib',
                '                aiii)cccccccw',
                '                aiiiiiiiiiiib',
                '                xddddddddg2ib',
                '                         aiib',
            ],
            [
                '         + ` + ~ ',
                '  + + F yccccccccw E + + + + J + +',
                'yccccccceiiiiiiiifcccccccccccccccccw',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiib',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiib',
                'xdddddddgiqrrrrsihdddddddddddddddddz',
                '        aituuuuvib',
                '        aituuuuvib',
                '        aituuuuvib + + + + + + _ + ',
                'yccccccceiABBBBCifcccccccccccccccccw',
                'aoiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiib',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiib',
                'xdddddddgiqrrrrsihdddddddddddddddddz',
                '        aituuuuvib',
                '        aituuuuvib',
                ' G + +  aituuuuvib+ + + + + + H +',
                'yccccccceiABBBBCifcccccccccccccccccw',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiib',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiib',
                'xddddddddddgihdddddddddddddddddddddz',
                '           aib',
                '           aib',
                '           aib',
                '           x>z',
            ],
            [
                '          y^w',
                '          aib',
                '          aib',
                '          aib',
                'yLcKccKccceifccKccKccLw',
                'aiNiiNiiiiiNNiiiiNiiiNb',
                'xdddddddgiqrsihdddddddz',
                '        aItuvIb',
                '        aituvib',
                '        aItuvIb',
                'yLcKccKceituvifKccKccLwyccccccccc<cLw',
                'aNiiiNiiiituviiiiNiiiNO%iiiiiiiiiiiib',
                'xdddddddgituvihdddddddzxddddddddddddz',
                '        aItuvIb',
                '        aituvib',
                '        aItuvIb',
                'yLcKccKceituvifKccKccLw',
                'aiNiiNiiiiABCiiiiNiiiNb',
                'xdddddddddgihdddddddddz',
                '          x>z',
            ],
            [
                'yccccw',
                'aiRiib',
                'aqrrsb',
                'atuuvb',
                'aABBCb',
                'xgiihz',
                ' aiib ',
                ' a1ib ',
                ' aiib ',
                ' xddz  ',
            ],
            [
                'yccccw',
                'akDikb',
                'aqrrsb',
                'atuuvb',
                'aABBCb',
                'xgiihz',
                ' aiib ',
                ' a1ib ',
                ' aiib ',
                ' xddz  ',
            ],
            [
                '                        y^w',
                '                        aib',
                '                        aib',
                '                        aib',
                'ycLcTcccTcccTcccTcccTccceifTcccTcccTcccTcccTccccLcw',
                'aiUiiUiiiiiUUUiiiiiiiiiiiiiiiiiiiiiiiiiiUiUUUiUiiib',
                'aiiiiiUiiUUUUiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiUUUUiiUb',
                'xdddddddddddddddgiiUiqrrrrrrrsiUiihdddddddddddddddz',
                '                aimnltuuuuuuuvmnilb',
                '                amniltuuuuuuuvmnlib',
                '                aiiiiABBBBBBBCiiiib',
                '                xdddddddgihdddddddz',
                '                        aib',
                '                        aib',
                '                        aib',
                '                        xVz',
            ],
            [
                'yccccw',
                'aiSiib',
                'aqrrsb',
                'atuuvb',
                'aABBCb',
                'xgiihz',
                ' aiib ',
                ' a1ib ',
                ' aiib ',
                ' xddz  ',
            ],
            [
                'yTcccTcccTcccTcccTcccTcccTcccTcccTcccTcccc>cw',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiUiiiiiUiiib',
                'aiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiUiiiiiUb',
                'xd<dddddddddddddddddddddddddddddddddddddddddz',
            ],
            [
                'ycLcw&&&&&yTcccTcccTcccTcccTcccTcccTcccTcccTcccTcccTcccTcccwyc>cw',
                'aiiiO     %iiiiiiiiiiiiiiiiiiiUUUUiiiiUUUUUUUUUUUiUUiiUiiiiO%iiib',
                'xdddz&&&&&xd<ddddddddddddddddddddddddddddddddddddddddddddddzxdddz',
            ],
            [
                '              yccw',
                '       yc/c\\cwa1ibyc<c>cw',
                '       aiiiiWbaiibaXiiiib',
                '       xdddddzaiibxdddddz',
                '   ycVcccccccceWXfcccccccc^cw',
                '   aXiiii!iiii!iiiiiiiWZiii!b',
                '   xddddddddddddddddddddddddz',
                'yccccccccccccccccccccccccccccccw',
                'a!ii!iiYZiiiiiYXiii!iiWXiii!iiWb',
                'xd[dddddddddddddddddddddddddd]dz',
            ],
            [
                '         y^w',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                'yc<cccccceifcccccc>cw',
                'aiiiiiiiiiZiiiii!iiWb',
                'xddddddddgihddddddddz',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         xVz',
            ],
            [
                'ycccw',
                'aX$Wb',
                'aWiXb',
                'xgihz',
                ' aZb',
                ' aYb',
                ' aZb',
                ' xVz',
            ],
            [
                'yccccw',
                'aXQiWb',
                'aiiiib',
                'aiiiib',
                'aWiiXb',
                'xgiihz',
                ' aiib ',
                ' a1ib ',
                ' aiib ',
                ' xddz  ',
            ],
            [
                '         y^w',
                '         aib',
                '         aib',
                '         aWb',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                'yc<cccccceifcccccc>cw',
                'aiiiiii!iiWiiiiiiiiib',
                'xddddddddgihddddddddz',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         xVz',
            ],
            [
                '         y^w',
                '         aWb',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                'yc<cccccceifcccccc>cw',
                'aiiiiiiiii!iiiiiiiiib',
                'xddddddddgihddddddddz',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         xVz',
            ],
            [
                '         y^w',
                '         aib',
                '         aib',
                '         aib',
                '         aZb',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                'yc<cccccceifcccccc>cw',
                'aYZii!iiiiWiii!iYZiib',
                'xddddddddgihddddddddz',
                '         aib',
                '         aib',
                '         aib',
                '         aYb',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         xVz',
            ],
            [
                '         y^w',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                'yc<cccccceifcccccc>cw',
                'aiiiiiiiiiiiiiiiiiiWb',
                'xddddddddgihddddddddz',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         aib',
                '         xVz',
            ],
            [],
            [],
            [   
                ' yccccccw#',
                '@aiipp1ib ',
                ' aiiiiiib ',
                ' aWXhgiib ',
                ' aiifeWXb ',
                ' a2iiiiib@',
                ' aiippiib',
                ' xddddddz',
            ],
            [
                '#yccccccw',
                ' aXiii1Wb',
                '@aiiiiiib@',
                ' aiihgiib',
                ' aiifeiib#',
                ' a2iiiiib@',
                ' aXiiiiWb',
                ' xddddddz',
            ],
            [
                ' yccccccw',
                '@aXiWX1Wb#',
                '#aiiiiiib#',
                ' aiihgWXb@',
                ' aWXfeiib',
                '@a2WiiXib#',
                '#aXiWXiWb@',
                ' xddddddz',
            ], 
            [
                ' yccccccw',
                '@aXiWX1Wb#',
                '#aiiiiiib@',
                '@aiihgWXb#',
                ' aWXfeiib@',
                '#a2WiiXib#',
                '@aXiWXiWb@',
                ' xddddddz',
            ],
            [
                '   yccw',
                '   a1ib',
                '  #aiib',
                'ycceiifccw',
                'aIWqrrsXIb@',
                'aIituuviIb#',
                'aIituuviIb@',
                'aIituuvXIb#',
                'aIituuviIb@',
                'aIituuviIb#',
                'aIituuviIb@',
                'aIWtuuviIb#',
                'aIituuviIb@',
                'aIXABBCWIb#',
                'xddgWXhddz',
                '  @a2ib#',
                '   aiib',
                '   xddz',
            ],
            [
                'ycLcw @#  ycLcw #@  ycLcw',
                'aXiWb #@  aXiWb @#  aXiWb',
                'aqrsb @#  aqrsb #@  aqrsb',
                'atuvb #@  atuvb @#  atuvb',
                'atuvfcccccetuvfcccccetuvb',
                'atuviiWIXiituviiiWIXituvb',
                'aABCiiXIWiituviiiXIWiABCb',
                'aWiiiiiiiiituviiiiiiiiiWb',
                'xddddddgiiituviiihddddddz',
                '    @# aiiXtuviiib #@',
                '    #@ aiiituviWib @#',
                'yc<cccceiiituviiifccccc>cw',
                'aiiiWXiiiiituviiiiiWXiiiib',
                'xddddddddgituvihdddddddddz',
                '    #@   aXtuvWb',
                '         aWtuvXfcccccccw',
                '         aXABCiiiWXiiiib',
                '         xddddddddddg2ib',
                '                    aiib',
            ],
            [
                'yccccw',
                'aXPiWb',
                'aqrrsb',
                'atuuvb',
                'aABBCb',
                'xgXWhz',
                ' aiib ',
                ' a1ib ',
                ' aiib ',
                ' xddz  ',
            ],


        ]
        const doorMappings = {
            1: {
                '<': {
                    targetLevel: 9,
                    targetX: 801,
                    targetY: 96,
                    keys: [
                        ()=>{
                            if(gamestate.mmFound){
                                return true;
                            }else{
                                dialog('That Monster Maker is around here somewhere! I can\'t go to The Galley until I find it.', player, player.pos)
                                return false;
                            }
                        }
                    ]

                },
                '>': {
                    targetLevel: 2,
                    targetX: 800,
                    targetY: 1433,
                    keys: [
                        ()=>{
                            if(gamestate.mmFound){
                                return true;
                            }else{
                                dialog('That Monster Maker is around here somewhere! I can\'t go to The Library until I find it.', player, player.pos)
                                return false;
                            }
                        },
                    ]
                },
                '^': {
                    targetLevel: 3,
                    targetX: 737,
                    targetY: 1182,
                    keys: [
                        ()=>{
                            if(gamestate.mmFound){
                                return true;
                            }else{
                                dialog('That Monster Maker is around here somewhere! I can\'t go to The Parlor until I find it.', player, player.pos)
                                return false;
                            }
                        },
                    ]
                },
                'v':{
                    targetLevel: 5,
                    targetX: 194,
                    targetY: 428,
                    keys: [
                        ()=>{
                            if(gamestate.mmFound){
                                
                                return true;
                            }else{
                                dialog('Where in the blazes is that Monster Maker Machine? I can\'t leave here until I find it.', player, player.pos)
                                return false;
                            }
                        },
                    ]
                }
            },
            2: {
                '>': {
                    targetLevel: 1,
                    targetX: 353,
                    targetY: 345,
                },
            },
            3:{
                '^': {
                    targetLevel: 3,
                    targetX: 737,
                    targetY: 1182,
                    keys: [
                        ()=>{
                            if(buttonsPressed==6){
                                return true;
                            }else{
                                let left = 6-buttonsPressed
                                dialog('There are '+ left+' unpressed buttons remaining.', player, player.pos)
                            }
                        }
                    ]
                },
                '<': {
                    targetLevel: 4,
                    targetX: 194,
                    targetY: 428,
                    keys: [
                        ()=>{
                            if(buttonsPressed==7){
                                return true;
                            }else{
                                let left = 7-buttonsPressed
                                dialog('There are '+ left+' unpressed buttons remaining.', player, player.pos)
                            }
                        }
                    ]
                },
                '>':{
                    targetLevel: 1,
                    targetX: 2272,
                    targetY: 664,
                }
            },
            4:{},
            5:{},
            6: {
                '^':{
                    targetLevel: 7,
                    targetX: 194,
                    targetY: 428,
                    keys:[
                        ()=>{
                            if(buttonsPressed==2){
                                return true;
                            }else{
                                let left = 2-buttonsPressed
                                dialog('There are '+ left+' unpressed buttons remaining.', player, player.pos)
                            }
                        }
                    ]
                },
                'v':{
                    targetLevel: 9,
                    targetX: 3997,
                    targetY: 96,
                },
            },
            7:{},
            8:{},
            9:{
                '>':{
                   targetLevel: 6,
                   targetX: 1638,
                   targetY: 926,
                   keys:[
                        ()=>{
                            if(buttonsPressed==1){
                                return true;
                            }
                        }    
                   ]
                },
                '<':{
                    targetLevel: 1,
                    targetX: 2015,
                    targetY: 340,
                },
            },
            10:{
                '^':{
                    targetLevel: 10,
                    targetX: 1890,
                    targetY: 540
                },                
                'v':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '[':{
                    targetLevel: 10,
                    targetX: 1309,
                    targetY: 150
                },                
                ']':{
                    targetLevel: 10,
                    targetX: 735,
                    targetY: 150
                },                
                '<':{
                    targetLevel: 10,
                    targetX: 160,
                    targetY: 540
                },                
                '>':{
                    targetLevel: 10,
                    targetX: 1890,
                    targetY: 540
                },                
                '/':{
                    targetLevel: 13,
                    targetX: 194,
                    targetY: 428
                },                
                '\\':{
                    targetLevel: 10,
                    targetX: 1890,
                    targetY: 540
                },                
            },
            11:{
                '^':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '>':{
                    targetLevel: 14,
                    targetX: 672,
                    targetY: 1250
                },                
                '<':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                'v':{
                    targetLevel: 10,
                    targetX: 350,
                    targetY:350
                },                

            },
            12:{
                'v':{
                    targetLevel: 10,
                    targetX: 350,
                    targetY:350
                },                
            },
            13:{},
            14:{
                '^':{
                    targetLevel: 15,
                    targetX: 672,
                    targetY: 1250
                },                
                '>':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '<':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                'v':{
                    targetLevel: 10,
                    targetX: 350,
                    targetY:350
                },                

            },
            15:{
                '^':{
                    targetLevel: 16,
                    targetX: 672,
                    targetY: 1250
                },                
                '>':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '<':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                'v':{
                    targetLevel: 10,
                    targetX: 350,
                    targetY:350
                },                

            },
            16:{
                '^':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '>':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '<':{
                    targetLevel: 17,
                    targetX: 672,
                    targetY: 1250
                },                
                'v':{
                    targetLevel: 10,
                    targetX: 350,
                    targetY:350
                },                

            },
            17:{
                '^':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                '>':{                    
                    targetLevel: 12,
                    targetX: 160,
                    targetY: 428
                },                
                '<':{
                    targetLevel: 11,
                    targetX: 672,
                    targetY: 1250
                },                
                'v':{
                    targetLevel: 10,
                    targetX: 350,
                    targetY:350
                },                

            },
            25:{
                '<':{
                    targetLevel: 0,
                    targetX: 0,
                    targetY:0,
                    keys:[
                        ()=>{
                            return false;
                        }
                    ]
                },
                '>':{
                    targetLevel: 26,
                    targetX: 194,
                    targetY: 428,
                    keys:[
                        ()=>{
                            if(buttonsPressed==3){
                                return true;
                            }else{
                                let left = 3-buttonsPressed
                                dialog('There are '+ left+' unpressed buttons remaining.', player, player.pos)
                            }
                        }
                    ]
                }
            }
        }
        const stairMappings = {
            0: {
                2: {
                    targetLevel: 1,
                    targetX: 1730,
                    targetY: 215
                }
            },
            1: {
                1: {
                    targetLevel: 0,
                    targetX: 194,
                    targetY: 428
                },
                2:{
                    targetLevel: 10,
                    targetX: 1026,
                    targetY: 210,
                    keys:[
                        ()=>{
                            if(gamestate.mmFound){
                                //dialog('The Cellar is under construction.', player, player.pos)
                                //return false;
    
                                return true;
                            }else{
                                dialog('Where in the blazes is that Monster Maker Machine? I can\'t go to The Cellar until I find it.', player, player.pos)
                                return false;
                            }
                        }
                    ]
                },
                3:{
                    targetLevel: 20,
                    targetX: 192,
                    targetY: 300,
                    keys:[
                        ()=>{
                            if(gamestate.mmFound){   
                                return true;
                            }else{
                                dialog('Where in the blazes is that Monster Maker Machine? I can\'t go to The Tower until I find it.', player, player.pos)
                                return false;
                            }
                        }
                    ]
                }
            },
            2:{},
            3:{
                2: {
                    targetLevel: 1,
                    targetX: 2272,
                    targetY: 786
                }
                
            },
            4:{
                1:{
                    targetLevel: 3,
                    targetX: 737,
                    targetY: 76,
                }
            },
            5: {
                1: {
                    targetLevel: 1,
                    targetX: 98,
                    targetY: 657
                }
            },
            6:{},
            7:{
                1:{
                    targetLevel: 6,
                    targetX: 1627,
                    targetY: 98
                }
            },
            10:{
                1:{
                    targetLevel: 1,
                    targetX: 1730,
                    targetY:1050
                },                
            },
            13:{
                1:{
                    targetLevel: 10,
                    targetX: 1695,
                    targetY:350
                },                
            },
            20:{
                1:{
                    targetLevel: 21,
                    targetX: 192,
                    targetY:300
                },
                2:{
                    targetLevel: 1,
                    targetX: 640,
                    targetY:210
                }
            },
            21:{
                1:{
                    targetLevel: 22,
                    targetX: 192,
                    targetY:300
                },
                2:{
                    targetLevel: 20,
                    targetX: 448,
                    targetY:224
                }
            },
            22:{
                1:{
                    targetLevel: 23,
                    targetX: 192,
                    targetY:300
                },
                2:{
                    targetLevel: 21,
                    targetX: 448,
                    targetY:224
                }
            },
            23:{
                1:{
                    targetLevel: 24,
                    targetX: 320,
                    targetY:924
                },
                2:{
                    targetLevel: 22,
                    targetX: 448,
                    targetY:224
                }
            },
            24:{
                1:{
                    targetLevel: 25,
                    targetX: 1410,
                    targetY:1064
                },
                2:{
                    targetLevel: 23,
                    targetX: 382,
                    targetY:224
                }
            },
            25:{
                2:{
                    targetLevel: 24,
                    targetX: 322,
                    targetY:250
                }
            },
            26:{
                1:{
                    targetLevel: 25,
                    targetX: 1500,
                    targetY:798
                }
            }

        }
        const bookMappings = {
            'manual': ()=>{
                dialog('Volume I: Overview\n\nThe Monser Maker Machine is configured by setting the four bits that make up the Monster Byte.\nThe levers that allow for setting and unsetting the bits in the Monster Byte are located in the Mansion as follows:\n\nBit 1:\tThe Tower\nBit 2:\tThe Cellar\nBit 3:\tThe Parlor\nBit 4:\tThe Galley\n', player, player.pos)
            },
            'bit1': ()=>{
                dialog('Volume II: Monster Byte Bit 1 Settings and Corresponding Monster Types\nSkeleton:\t1\nBoar:\t0\nBeast:\t0\nMushroom:\t1\ntroll:\t1\nreaver:\t0\nDraconian:\t1\nelemental:\t0\niron Golem:\t1\nGiant mushroom:\t0\nGiant troll:\t0\nGiant Beast:\t1\nGiant Boar:\t1\nDragonman:\t0\nGiant Iron Golem:\t1', player, player.pos)
            },
            'bit2': ()=>{
                dialog('Volume III: Monster Byte Bit 2 Settings and Corresponding Monster Types\nSkeleton\t0\nBoar\t1\nBeast\t0\nMushroom\t1\ntroll\t0\nreaver\t1\nDraconian\t1\nelemental\t0\niron Golem\t0\nGiant mushroom\t1\nGiant troll\t0\nGiant Beast\t1\nGiant Boar\t0\nDragonman\t1\nGiant Iron Golem\t1', player, player.pos)

            },
            'bit3': ()=>{
                dialog('Volume IV: Monster Byte Bit 3 Settings and Corresponding Monster Types\nSkeleton\t0\nBoar\t0\nBeast\t1\nMushroom\t0\ntroll\t1\nreaver\t1\nDraconian\t1\nelemental\t0\niron Golem\t0\nGiant mushroom\t0\nGiant troll\t1\nGiant Beast\t0\nGiant Boar\t1\nDragonman\t1\nGiant Iron Golem\t1', player, player.pos)
            },
            'bit4': ()=>{
                dialog('Volume V: Monster Byte Bit 4 Settings and Corresponding Monster Types\nSkeleton\t0\nBoar\t0\nBeast\t0\nMushroom\t0\ntroll\t0\nreaver\t0\nDraconian\t0\nelemental\t1\niron Golem\t1\nGiant mushroom\t1\nGiant troll\t1\nGiant Beast\t1\nGiant Boar\t1\nDragonman\t1\nGiant Iron Golem\t1', player, player.pos)
            },
            'appendixa': ()=>{
                dialog('Appendix A: Other features and settings\n\nYou model is equiped with a tissue scanner and transmogrifier. Living creatures can be replicated and used a basis for a monster privided that sufficient power is supplied. See breakers under Appendix B', player, player.pos)
            },
            'appendixb': ()=>{
                dialog('Appendix B: Power and Maintenance\n\nTo enable some features please supply full power to the unit. Any breakers must be thrown.', player, player.pos)
            },
            'note': ()=>{
                dialog('A old note written in messy handwriting\n\n"Right, Up, Up, Left, Right"', player, player.pos)
            },
        }
        const levelCfg = {
            width: 64,
            height: 64,
            a: () => [sprite('right-wall'), area(), solid(), 'wall'],
            b: () => [sprite('left-wall'), area(), solid(), 'wall'],
            c: () => [sprite('top-wall'), area(), solid(), layer('bg'), 'wall'],
            d: () => [sprite('bottom-wall'), area(), solid(), layer('fg'), 'wall'],
            e: () => [sprite('top-right-inside-wall'), area(), solid(), layer('bg'), 'wall'],
            f: () => [sprite('top-left-inside-wall'), area(), solid(), layer('bg'), 'wall'],
            g: () => [sprite('bottom-right-inside-wall'), area(), solid(), layer('fg'), 'wall'],
            h: () => [sprite('bottom-left-inside-wall'), area(), solid(), layer('fg'), 'wall'],
            i: () => [sprite('floor'), layer('bg')],
            j: () => [sprite('bed'), layer('mg'), area(), solid(), 'replace'],
            k: () => [sprite('chair'), layer('mg'), area(), solid(), 'replace'],
            l: () => [sprite('chair2'), layer('mg'), area(), solid(), 'replace'],
            m: () => [sprite('chair3'), layer('mg'), area(), solid(), 'replace'],
            n: () => [sprite('table'), layer('mg'), area(), solid(), 'replace',],
            o: () => [sprite('table2'), layer('mg'), area({width:192, height:96}), solid(), 'replace', 'book',  {book: 'note'}],
            p: () => [sprite('statue'), layer('mg'), area(), solid(), 'replace'],

            q: () => [sprite('top-left-carpet'), layer('bg')],
            r: () => [sprite('top-carpet'), layer('bg')],
            s: () => [sprite('top-right-carpet'), layer('bg')],

            t: () => [sprite('left-carpet'), layer('bg')],
            u: () => [sprite('carpet'), layer('bg')],
            v: () => [sprite('right-carpet'), layer('bg')],
            w: () => [sprite('top-right-wall'), area(), solid(), 'wall'],
            x: () => [sprite('bottom-left-wall'), area(), solid(), 'wall'],
            y: () => [sprite('top-left-wall'), area(), solid(), 'wall'],
            z: () => [sprite('bottom-right-wall'), area(), solid(), 'wall'],
            A: () => [sprite('bottom-left-carpet'), layer('bg')],
            B: () => [sprite('bottom-carpet'), layer('bg')],
            C: () => [sprite('bottom-right-carpet'), layer('bg')],
            D: () => [sprite('bed'), layer('bg'), layer('mg'), area(), solid(), 'replace'],
            E: () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid(), 'book', {book: 'manual'}],
            F: () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid(), 'book', {book: 'bit1'}],
            G: () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid(), 'book', {book: 'bit2'}],
            H: () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid(), 'book', {book: 'bit3'}],
            '`': () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid(), 'book', {book: 'appendixa'}],
            '~': () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid(), 'book', {book: 'appendixb'}],
            I: () => [sprite('column'), layer('mg'), area(), solid(), 'replace'],
            J: () => [sprite('bookshelf'), layer('mg'), area(), solid(), 'book', {book: 'bit4'}],
            K: () => [sprite('couch'), layer('mg'), area(), solid(), 'replace-wall'],
            L: () => [sprite('button'), layer('mg'), area(), solid(), 'button', 'replace-wall', {replaceNotSolid:true}],
            M: () => [sprite('monmach'), {frame: 0}, area(), solid(), layer('mg'), 'monmach'],
            N: () => [sprite('ghoulie'), {frame: 0}, area({scale:.6}), solid(), layer('mg'), 'ghoulie', 'replace', 'destructible', 'hurts', { dir: -1, timer: 0, expSpr:'bone'  }],
            O: () => [sprite('left-wall'), area(), solid(), 'wall', 'replace', 'destructible', ],
            P: () => [sprite('switch'), {frame: 0}, area(), solid(), layer('mg'), 'replace', 'switch', {bit:1}],
            Q: () => [sprite('switch'), {frame: 0}, area(), solid(), layer('mg'), 'replace', 'switch', {bit:2}],
            R: () => [sprite('switch'), {frame: 0}, area(), solid(), layer('mg'), 'replace', 'switch', {bit:3}],
            S: () => [sprite('switch'), {frame: 0}, area(), solid(), layer('mg'), 'replace', 'switch', {bit:4}],
            T: () => [sprite('shelf'), layer('mg'), 'replace-wall'],
            U: () => [sprite('slime', {anim: "idle"}), {frame: 0}, area({scale:.6}), solid(), layer('mg'), scale(2),  'slime', 'replace', 'hurts', { state: 'idle', dir:{x:1,y:1},  timer: 0, ready: true}],
            W: () => [sprite('web'), layer('fg'), area(), 'replace', 'destructible'],
            X: () => [sprite('web2'), layer('fg'), area(), 'replace', 'destructible'],
            Y: () => [sprite('web'), layer('fg'), area(), 'replace', 'destructible', 'trigger-spider'],
            Z: () => [sprite('web2'), layer('fg'), area(), 'replace', 'destructible', 'trigger-spider'],
            '!': () => [sprite('spider'), {anim:'Walk-L'}, area({scale:.6}), solid(), layer('mg'), 'spider', 'replace', 'destructible', 'hurts', { dir: -1, timer: 0, adjusted:false }],
            '@': () => [sprite('bat'), {anim:'Walk-L'}, area({scale:.6}), layer('ui'), 'bat', 'destructible', 'hurts', { dir: -1, timer: 0 }],
            '#': () => [sprite('bat'), {anim:'Walk-R'}, area({scale:.6}), layer('ui'), 'bat', 'destructible', 'hurts', { dir: 1, timer: 0 }],
            '$': () => [sprite('breaker'), {frame: gamestate.breakerSet?1:0}, area(), solid(), layer('mg'), 'replace', 'breaker', {reset:false}],
            '%': () => [sprite('right-wall'), area(), solid(), 'wall', 'replace', 'destructible', ],
            '&': () => [sprite('blank'), area(), solid(), 'wall' ],
            '*': () => [sprite('galley-sign'), area(), solid(), layer('bg'), 'wall'],
            '(': () => [sprite('library-sign'), area(), solid(), layer('bg'), 'wall'],
            ')': () => [sprite('cellar-sign'), area(), solid(), layer('bg'), 'wall'],
            '-': () => [sprite('parlor-sign'), area(), solid(), layer('bg'), 'wall'],
            '=': () => [sprite('tower-sign'), area(), solid(), layer('bg'), 'wall'],
            '_': () => [sprite('tears'), layer('bg'), layer('mg'), area(), solid(), 'tears'],
            '+': () => [sprite('bookshelf'), layer('bg'), layer('mg'), area(), solid()],

            '>': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: '>'
            }],
            '<': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: '<'
            }],
            '^': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: '^'
            }],
            'V': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: 'v'
            }],
            '/': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: '/'
            }],
            '\\': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: '\\'
            }],
            '[': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: '['
            }],
            ']': () => [sprite('top-door'), area(), layer('mg'), solid(), 'door', 'replace', {
                doorLookup: ']'
            }],
            1: () => [sprite('stairs-up'), layer('mg'), area(), 'stairs', 'replace', {
                stairLookup: 1
            }],
            2: () => [sprite('stairs-dn'), layer('mg'), area(), 'stairs', 'replace', {
                stairLookup: 2
            }],
            3: () => [sprite('stairs-up'), layer('mg'), area(), 'stairs', 'replace', {
                stairLookup: 3
            }],
        }
        if(gamestate.breakerSet){
            levelCfg.D = () => [sprite('bed2'), layer('mg'), area(), solid(), 'replace', 'bean'];
        }

        addLevel(maps[level], levelCfg)

        const player = add([
            sprite('doctor'),
            pos(startX, startY),
            {
                dir: vec2(0, 0),
                animDir: vec2(0, 0),
                state: 'Laugh',
                setState: function (state) {
                    if (player.state == state) return;
                    player.state = state;
                    if (player.state == 'Laugh') {
                        player.play(state)
                        wait(2, () => {
                            if (player.state == 'Laugh') player.setState('Idle')
                        })
                    } else if (player.state == 'Idle') {
                        player.play(state)
                    }
                }
            },
            area({
                scale: .5
            }),
            solid(),
            scale(1.5),
            origin('center'),
            layer('mg')
        ])
        if(newGame){
            hmusic = play("house", {
                volume: 0.15,
                loop: false
            });
            newgame = false;
            //dialog('1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16',
            //  player,
            //    player.pos,
            //)
            if(newGameMsg){
                dialog(newGameMsg,
                    player,
                    player.pos,
                )
            } else {
                dialog('Yawn... Another fine morning... TO MAKE THOSE MISERABLE VILLAGERS PAY!\n\nHAHAHAHA!\n\nTo the Monster Maker Machine!',
                    player,
                    player.pos,
                )
            }
      player.play("Laugh")
        }else{
            player.play("Idle")

        }

        camPos(startX, startY)
        player.onUpdate((music) => {
            //console.log(player.pos)
            if(player.dead){
                return
            }
            if (player.dir.y != player.animDir.y || player.dir.x != player.animDir.x) {
                player.animDir.x = player.dir.x;
                player.animDir.y = player.dir.y;
                if (player.dir.x == -1 && player.dir.y == -1) {
                    player.play('NW-Walk')
                } else if (player.dir.x == 1 && player.dir.y == -1) {
                    player.play('NE-Walk')
                } else if (player.dir.x == 1 && player.dir.y == 1) {
                    player.play('SE-Walk')
                } else if (player.dir.x == -1 && player.dir.y == 1) {
                    player.play('SW-Walk')
                } else if (player.dir.x == 0 && player.dir.y == 1) {
                    player.play('S-walk')
                } else if (player.dir.x == 0 && player.dir.y == -1) {
                    player.play('N-Walk')
                } else if (player.dir.x == -1 && player.dir.y == 0) {
                    player.play('W-Walk')
                } else if (player.dir.x == 1 && player.dir.y == 0) {
                    player.play('E-Walk')
                } else if (player.dir.x == 0 && player.dir.y == 0) {
                    player.play('Idle')
                }
            }

        })

        player.onCollide('door', (d) => {
            const doorMapping = doorMappings[level][d.doorLookup];
            let LockFlag = true;
            if(doorMapping&&doorMapping.keys){
                doorMapping.keys.forEach((callback)=>{
                    if(callback()){
                        LockFlag = false;
                    }
                })
            }else{
                LockFlag = false
            }
            if(!LockFlag){
                destroy(d)
                wait(.2, () => {
                    go('mansion', {
                        level: doorMapping.targetLevel,
                        //score: scoreLabel.value,
                        startX: doorMapping.targetX,
                        startY: doorMapping.targetY,
                    })
                })    
            }
        })
        player.onCollide('stairs', (d) => {
            const stairMapping = stairMappings[level][d.stairLookup];
            let LockFlag = true;
            if(stairMapping&&stairMapping.keys){
                stairMapping.keys.forEach((callback)=>{
                    if(callback()){
                        LockFlag = false;
                    }
                })
            }else{
                LockFlag = false
            }
            if(!LockFlag){
                go('mansion', {
                    level: stairMapping.targetLevel,
                    //score: scoreLabel.value,
                    startX: stairMapping.targetX,
                    startY: stairMapping.targetY,
                })
            }
        })
        player.onCollide('book', (m) => {
            bookMappings[m.book]();
        });
        player.onCollide('button', (m) => {
            if(!m.pressed){
                m.pressed = true
                m.frame=1
                buttonsPressed++
                //dialog(buttonsPressed+' buttons activated', player, m.pos)
                shake(5)
            }
        });
        player.onCollide('monmach', (m) => {
            hmusic.stop();
            if(!m.open){

                burp({
                    volume: 2,
                    loop: false,
                    speed: .2,
                })

                camTween({x:m.pos.x+m.width/2, y:m.pos.y+m.height/2}, 16)
                for (let index = 0; index < 20; index++) {
                    setTimeout(()=>{
                        if(index<5) shake(index)
                        addExplosion('steam', m.pos.add(rand(128), rand(128)), {xv:130, yv:130}, .5, rand(3))
                    },index*100)
                }                
                wait(3, ()=>{
                    if(!gamestate.bit1&&!gamestate.bit2&&!gamestate.bit3&&!gamestate.bit4){
                        gamestate.mmFound=true
                        //Save state
                        saveState()
                        dialog('Ah the Monster Maker Machine. How Lovely. It seems to be ready to accept a cofiguration. Now I know those bit switches are around this old place somewhere.. . Perhaps I should head to the Library to refresh myself on the Users\' Manuals', 
                            player, 
                            {x:m.pos.x+m.width/2, y:m.pos.y+m.height/2},
                            [],
                            function(){
                                dialogOpen = true
                                camTween(player.pos, 8)
                                wait(1,()=>{
                                    dialogOpen = false
                                })
                            }

                        )    
                    }else{
                        let monByte = '0000'
                        if(gamestate.bit1) monByte = monByte.replaceAt(0, '1')
                        if(gamestate.bit2) monByte = monByte.replaceAt(1, '1')
                        if(gamestate.bit3) monByte = monByte.replaceAt(2, '1')
                        if(gamestate.bit4) monByte = monByte.replaceAt(3, '1')
                        dialog('The Monster Maker Machine is configured with the following Monster Byte:\n\n'+monByte+'\n\n', 
                            player, 
                            {x:m.pos.x+96, y:m.pos.y+64},
                            ['Create Monster', 'Cancel'],
                            (i)=>{
                                //hmusic.stop();
                                if(i==0) go('village', monsterMapping[monByte])
                            }
                        )    

                    }
                })
                m.open = true;
                m.play('open', {loop:false})    
            }
        })
        player.onCollide('tears', (m) => {
            if(m.open) return
            //console.log('tears')
            m.open = true
            m.play('open', {loop: false})
            camTween({x:m.pos.x+m.width/2, y:m.pos.y+m.height/2}, 8)
            wait(1, ()=>{
                        if(gamestate.tears>0){
                            dialog('Spend Villager tears in order to equip a new spell?\tTears:'+gamestate.tears,
                                player,
                                {x:m.pos.x+64, y:m.pos.y+64},
                                ['Kaboom:\t0 Tears', 'Lightning:\t100', 'Fireball:\t200', 'Shadowbolt:\t500', 'Cancel'],
                                (i)=>{
                                    let key
                                    let name
                                    let cost
                                    if(i==0){
//                                        gamestate.tears -= 0;
                                        gamestate.spellKey = 'kaboom';
                                        dialog(
                                            'Kaboom was equipped',
                                            player,
                                            {x:m.pos.x+64, y:m.pos.y+64}
                                        )        
                                    } else if(i==1 && gamestate.tears>=100){
                                        gamestate.tears -= 100;
                                        gamestate.spellKey = 'lightningstorm';
                                        dialog(
                                            'Lightning was equipped',
                                            player,
                                            {x:m.pos.x+64, y:m.pos.y+64}
                                        )        
                                    } else if(i==3 && gamestate.tears>=500){
                                        gamestate.tears -= 500;
                                        gamestate.spellKey = 'shadowbolt';
                                        dialog(
                                            'Shadowbolt was equipped',
                                            player,
                                            {x:m.pos.x+64, y:m.pos.y+64}
                                        )        
                                    } else if(i==2 && gamestate.tears>=200){
                                        gamestate.tears -= 200;
                                        gamestate.spellKey = 'fireball';
                                        dialog(
                                            'Fireball was equipped',
                                            player,
                                            {x:m.pos.x+64, y:m.pos.y+64}
                                        )        
                                    } else if(i==4){
                                    } else{
                                        dialog(
                                            'Not enough tears.',
                                            player,
                                            {x:m.pos.x+64, y:m.pos.y+64}
                                        )     
                                    }
                                    saveState()
                            }) 
                        }else{
                            dialog('The Resevoir of Tears is empty. Construct a monster to extract tears from the villagers.',
                                player,
                                {x:m.pos.x+64, y:m.pos.y+64},
                            )
                        }
            })
            
        })
        player.onCollide('bean', (m) => {
                    dialog('Ah my Lovely kitty. How are you this fine evening, Bean? How would you like to tach those villagers the lesson of thier lives? HAHAHA!\n\nSend Bean to terrorize the village?', 
                        player,  
                        {x:m.pos.x+64, y:m.pos.y+64},
                        ['Yes','No'],
                        function(i){
                            if(i==0){
                                dialog('Take up your arms and go forth my pet.. They\'ll all be sorry that they didn\'t come to my birthday party!',
                                    player,
                                    {x:m.pos.x+64, y:m.pos.y+64},
                                    ['Continue', 'Cancel'],
                                    (i)=>{
                                        hmusic.stop();
                                        if(i==0) go('village', monsterMapping['bean'])


                                    }
                                )    
                            } else{
                                dialog('Very well. Perhaps later..',
                                    player,
                                    {x:m.pos.x+64, y:m.pos.y+64}
                                )    
                            }
                        }        
                    )
        })
        player.onCollide('trigger-spider', (m) => {
            let spider = add([sprite('spider', {anim:'Drop'}), pos(player.pos.x+rand(64)-32, player.pos.y+rand(64)-height()), area({scale:.6}), layer('ui'), 'spider-down', 'hurts', 'destructible', { dir: {x:0, y:0}, timer: 3, webs:[]}])
        });

        keyDown('left', () => {
            if(dialogOpen || player.dead) return
            player.move(-MOVE_SPEED, 0)
            player.dir.x = -1;
            player.setState('W-Walk')
            var currCam = camPos();
            if (currCam.x - player.pos.x > width() / 6) {
                camPos(player.pos.x + width() / 6, currCam.y);
            }
        })

        keyDown('right', () => {
            if(dialogOpen || player.dead) return
            player.move(MOVE_SPEED, 0)
            player.dir.x = 1
            player.setState('E-Walk')
            var currCam = camPos();
            if (player.pos.x - currCam.x > width() / 6) {
                camPos(player.pos.x - width() / 6, currCam.y);
            }
        })
        onKeyPress('up', () => {
            keystate = 'up'
        })
        keyDown('up', () => {
            if(dialogOpen || player.dead) return
            player.move(0, -MOVE_SPEED)
            player.dir.y = -1
            player.setState('N-Walk')
            var currCam = camPos();
            if (currCam.y - player.pos.y > height() / 6) {
                camPos(currCam.x, player.pos.y + height() / 6);
            }

        })
        onKeyPress('down', () => {
            keystate = 'down'
        })
        keyDown('down', () => {
            if(dialogOpen || player.dead) return
            player.move(0, MOVE_SPEED)
            player.dir.y = 1
            player.setState('S-walk')
            var currCam = camPos();
            if (player.pos.y - currCam.y > height() / 6) {
                camPos(currCam.x, player.pos.y - height() / 6);
            }
        })

        keyRelease(['up', 'down', ], () => {
            //keystate = ''
            player.dir.y = 0
            if(!player.dead) player.setState('Idle')
        })
        keyRelease(['left', 'right'], () => {
            //keystate = ''
            player.dir.x = 0
            if(!player.dead) player.setState('Idle')
        })
        keyRelease('space', ()=>{
            //keystate = ''
        })
        function spawnSpell(p) {
            console.log(p)
            const spell = spellMapping[gamestate.spellKey]
            let deg = 0;
            if(spell.expSpr){
                if(player.dir.y==1&&player.dir.x==0){
                    deg=90
                } else if(player.dir.y==0 && player.dir.x==-1) {
                    deg=180
                } else if(player.dir.y==-1 && player.dir.x==0) {
                    deg=270
                } else if(player.dir.y==1 && player.dir.x==1){
                    deg=45
                } else if(player.dir.y==1 && player.dir.x==-1){
                    deg=135
                } else if(player.dir.y==-1 && player.dir.x==1){
                    deg=320
                } else if(player.dir.y==-1 && player.dir.x==-1){
                    deg=225
                }
            }
            let obj
            let lifespan = spell.lifespan
            if(player.dir.x||player.dir.y||!spell.expSpr){
                obj = add([sprite(spell.sprite, {anim:'idle'}), pos(p), scale(spell.size), area({scale:.75}), rotate(deg), origin('center'), 'spell', {xv:player.dir.x*spell.velocity, yv:player.dir.y*spell.velocity}])
            }else{
                obj = add([sprite(spell.expSpr, {anim:'idle'}), pos(p), scale(1), area({scale:.75}), rotate(deg), origin('center'), 'spell', {xv:player.dir.x*spell.velocity, yv:player.dir.y*spell.velocity}])
                lifespan = 1
            }
            obj.onUpdate(()=>{
                obj.move(obj.xv,obj.yv)

            })
            if(spell.collide){
                obj.onCollide('wall', ()=>{
                    destroy(obj)
                    let ex = add([sprite(spell.expSpr, {anim:'idle', speed:30}), pos(obj.pos), scale(1), area({scale:.75}), origin('center'), 'spell', {xv:0, yv:0}])
                    wait(1, ()=>{
                        destroy(ex)
                    })
                })
            }
            if(spell.sprite=='explosion') shake((spell.size-.5)*4)
            wait(lifespan||1, () => {
                if (spell.sprite=='explosion'&& player.state == 'Idle' && !player.dead) {
                    player.setState('Laugh')
                }
                destroy(obj)
            })

        }
        onKeyPress('space', () => {
            keystate = 'space'
        })
        keyPress('space', () => {
            keystate = 'space'
            if(!dialogOpen && !player.dead){
                spawnSpell(player.pos.add(player.dir.scale(spellMapping[gamestate.spellKey].range)))    
            }
        })

        onUpdate('replace', (s) => {
            if(!s.tilereplaced){
                add([
                    sprite('floor'), 
                    layer('bg'),
                    pos(s.pos.x, s.pos.y)
                ])
                s.tilereplaced = true;
            } 
        
        })
        onUpdate('replace-wall', (s) => {
            if(!s.tilereplaced){
                add([
                    sprite('top-wall'), 
                    layer('bg'),
                    pos(s.pos.x, s.pos.y),
                    area(),
                    !s.replaceNotSolid?solid():'',
                ])
                s.tilereplaced = true;
            } 
        
        })
        const die = ()=>{
            if (player.dead) return
            player.dead = true;
            player.play('Die', {speed:15});
            shake(5)
            wait(1.5,()=>{
                player.dead = false
                go ('mansion', { level: 0, score: 0, startX: 192, startY:216, newGame:true })
            })
        }
        const addProjectile = (spr, ps, vel, lifespan, effect)=>{
            const p = add([
                sprite(spr),
                area(),
                pos(ps),
                layer('fg'),
                vel,
                'projectile',
                !effect?'destructible':'',
                !effect?'hurts':''
            ])
            p.play('idle', {speed:30})
            wait(lifespan, ()=>{
                destroy(p)
            })
        }
        const addExplosion = (spr, p, vel, lifespan, count)=>{
            for (let index = 0; index < count; index++) {
                const xv = (rand(vel.xv*2)-vel.xv)
                const yv = (rand(vel.yv)-vel.yv)
                addProjectile(spr, p, {xv:xv, yv:yv}, lifespan, true)
            }
            if(spr=='bone') {
                addProjectile('skull', p, {xv:0, yv:-200}, lifespan, true)
            }
        }
        onUpdate('projectile', (p)=>{
            p.move(p.xv, p.yv)
        })
        player.onCollide('hurts', (s) => {
            //return
            if (player.dead) return
            if(!player.dead){
                die();
            }
        })
        player.onCollide('breaker', (s) => {
            if(gamestate.breakerSet) return
            dialog('Do you want to reset the electrical breaker?',
            player,
            player.pos,
            ['Yes','No'],
            (i)=>{
                if(!i){
                    gamestate.breakerSet = true;
                    //Save state
                    saveState()
                    s.frame = 1
                }
            }
            )
        })
        player.onCollide('switch', (s) => {
            let bitKey = 'bit'+s.bit;
            dialog('Do you want to set bit '+s.bit+'?',
            player,
            player.pos,
            ['Set','Unset'],
            (i)=>{
                if(!i){
                    gamestate[bitKey] = 1
                    s.frame = 1
                }else{
                    gamestate[bitKey] = 0
                    s.frame = 0
                }
                //Save state
                saveState()
            }
            )
        })
        onCollide('spell', 'destructible', (k,s) => {
            //wait(1, () => {
            //  destroy(k)
            //})
            if(s.expSpr) {
                addExplosion(s.expSpr , s.pos,  {xv:200, yv:200}, .5, 5)
            } else{
                addExplosion('steam' , s.pos,  {xv:100, yv:100}, .35, 5)
            }
            destroy(s)
        })      
        onCollide('spell', 'slime', (k,s) => {
            //wait(1, () => {
            //  destroy(k)
            //})
            if(!s.ready) return
            if(s.small){
                destroy(s)
                addExplosion('slime-drop', s.pos, {xv:300, yv:300}, .5, 2)
            }else{
                s.small = true;
                const count = rand(3)+3
                for (let index = 0; index < count; index++) {
                    let ns = add([sprite('slime', {anim:'idle'}), pos(s.pos.x+rand(64)-32, s.pos.y+rand(64)-32), area({scale:.6}), solid(), layer('fg'), 'slime', 'hurts', { dir: {x:0, y:0}, timer: 3, small: true, ready: false}])
                    wait(.6, ()=>{
                        ns.ready = true;
                    })
                }
                addExplosion('slime-drop', s.pos,  {xv:300, yv:300}, .5, 5)
                s.scale = 1;
                s.play('idle')
            }
        })      
        onUpdate('tears', (m)=>{
            if(Math.abs((m.pos.x+64) - player.pos.x) > 96 && m.open){
                m.play('close', {loop:false})
                m.open = false
            }
        })
        onUpdate('slime', (s)=>{
            if(!s.ready) return
            if(s.timer<0){
                s.timer = 2
                if(player.pos.x-s.pos.x>0 && player.pos.y-s.pos.y>0){
                    //player is below and to the right of slime
                    if(rand(10)>5){
                        s.dir = {x:1, y:0}
                        s.state = 'walk-e'
                    }else{
                        s.dir = {x:0, y:1}
                        s.state = 'walk-s'
                    }
                }else if(player.pos.x-s.pos.x<=0 && player.pos.y-s.pos.y<=0){
                    //player is above and to the left of slime                
                    if(rand(10)>5){
                        s.dir = {x:-1, y:0}
                        s.state = 'walk-w'
                    }else{
                        s.dir = {x:0, y:-1}
                        s.state = 'walk-n'
                    }
                }else if(player.pos.x-s.pos.x<=0 && player.pos.y-s.pos.y>0){
                    //player is below and to the left of slime                
                    if(rand(10)>5){
                        s.dir = {x:-1, y:0}
                        s.state = 'walk-w'
                    }else{
                        s.dir = {x:0, y:1}
                        s.state = 'walk-s'
                    }
                }else if(player.pos.x-s.pos.x>0 && player.pos.y-s.pos.y<=0){
                    //player is above and to the right of slime                
                    if(rand(10)>5){
                        s.dir = {x:1, y:0}
                        s.state = 'walk-e'
                    }else{
                        s.dir = {x:0, y:-1}
                        s.state = 'walk-n'
                    }
                }    
            }
            s.timer -= dt()
            if(s.state!=s.playing){
                s.play(s.state)
                s.playing = s.state
            }
            s.move(s.dir.x * 10, s.dir.y * 10)
        })
        onUpdate('spider-down', (s)=>{
            let w = add([sprite('web-line'), pos(s.pos.x+16, s.pos.y+4), area({scale:.6}), layer('ui')])
            s.move(0, 270)
            s.webs.push(w)
            if(s.pos.y>player.pos.y-16){
                s.webs.forEach((w, i)=>{
                    wait(.004*i, ()=>{
                        destroy(w)
                    })
                })
                destroy(s)
                let spider = add([sprite('spider', {anim:'Drop'}), pos(s.pos.x, s.pos.y), area({scale:.6}), layer('mg'), solid(), 'spider', 'hurts', 'destructible', { dir: 0, timer: 2, adjusted: true, ready: false,}])
                if(player.pos.x>s.pos.x){
                    spider.dir=1
                    spider.play('Walk-R')
                }else{
                    spider.dir=-1
                    spider.play('Walk-L')
                }

            }
        })
        onUpdate('spider', (s)=>{
            if(!s.adjusted){
                s.move(0, rand(255)+255)
                s.adjusted = true;
            }else{
                s.move(s.dir * 170, 0)
                s.timer -= dt()
                if (s.timer <= 0) {
                    s.dir = -s.dir
                    if(s.dir > 0){
                      s.play('Walk-R')
                    }else{
                      s.play('Walk-L')
                    }
                    s.timer = rand(1)+1
                  }           
            }
        })
        
        onUpdate('bat', (s)=>{
            s.move(s.dir * 120, 0)
            s.timer -= dt()
            if (s.timer <= 0) {
                s.dir = -s.dir
                if(s.dir > 0){
                  s.play('Walk-R')
                }else{
                  s.play('Walk-L')
                }
                s.timer = rand(3)+3
              }       
        })
        
        onUpdate('ghoulie', (g)=>{
            g.move(0, g.dir * 50)
            g.timer -= dt()
            if(!g.shooting && Math.abs(player.pos.y-g.pos.y)<20){
                if(player.pos.x - g.pos.x > 0){
                    g.play('throw-e')
                    addProjectile('bone', g.pos, {xv:100, yv:0}, 3)
                }else{
                    g.play('throw-w')
                    addProjectile('bone', g.pos, {xv:-100, yv:0}, 3)
                }
                g.shooting = true
                g.timer = .25
            }
            if (g.timer <= 0) {
              g.shooting = false;
              g.dir = -g.dir
              if(g.dir > 0){
                g.play('walk-s')
              }else{
                g.play('walk-n')
              }
              g.timer = rand(2)+1
            }     
        })

    })
    scene('village', ({key, dex, spd, con, str, name, type, size, specials={}})=>{
        const music = play("title", {
            volume: 0.5,
            loop: false
        })

        //loadAseprite(key, 'monsters/'+key+'.png', 'monsters/'+key+'.json')
        const rangeAdj = 30-(size*10)
        const addTears = function(t){
            gamestate.tears += t
            console.log('tears', gamestate.tears)
            //Save state
            saveState()
        }
        let count = 0
        let level = 1;
        layers(['bg', 'mg', 'fg', 'obj', 'ui'], 'obj')
        const map = [
            '=B                                                                                                                                                                                                                                                           =================',
            '-                                                                                                                                                                                                                                                             ----------------',
            '-                                         1                                                                 1          1            1           1                                                     1          1                                            -------------------',
            '-                     1                                 1               1           1    1    1                                                                  1    1    1    1    1                                          1          1        1         ------------------',
            '-                                                                                                                                                                                                                                                              -----------------',
            '-                                                                                                                                                                                                                                                              --------------------',
            '-                                            X                                                                 X          X            X           X                                                     X          X                                           ------------------',
            '-                        W       ========================  W               W               X X              ==========================================              W    X        X X              =====================           Y          Y        Z       -------------------',
            '-================================------------------------===================================================------------------------------------------=============================================---------------------======================================--------------------',
            '----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------',
            '----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------',
            '-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------',
            ];
            const levelCfg = {
                width: 32,
                height: 32,
                'B': () => [sprite('mountains_bg'), origin('center'), pos(width()/2, height()/2,), 'background'],
                '1': () => [sprite('house')],
                '=': () => [sprite('terrain-top-center'), area({width:32, height:4}), solid(), origin('center'), 'ground'],
                '-': () => [sprite('terrain-center'), area(), solid(), origin('center'), 'ground'],
                'W': () => [sprite('building-door'), area({width:32, height:0}), origin('center'), 'enemy-gen', {sprite:'peasant', level:1, count:0, timer:3-(dex/2), genCount:str*5, hp: 5, str:1, dex:1}],
                'X': () => [sprite('building-door'), area({width:32, height:0}), origin('center'), 'enemy-gen', {sprite:'peasant', level:1, count:0, timer:3, genCount:str*6, hp: 5, str:1, dex:1}],
                'Y': () => [sprite('building-door'), area({width:32, height:0}), origin('center'), 'enemy-gen', {sprite:'militia', level:1, count:0, timer:3, genCount:str*8, hp: 10, str:3, dex:2}],
                'Z': () => [sprite('building-door'), area({width:32, height:0}), origin('center'), 'enemy-gen', {sprite:'knight', level:1, count:0, timer:3, genCount:100000, hp: 200, str:15, dex:15}],
            }
            addLevel(map, levelCfg) 
            onUpdate('enemy-gen', (e)=>{
                //console.log(count)
                e.timer-=dt()
                
                 if(e.count<e.genCount && e.timer<0){
                    if(Math.abs(e.pos.x-player.pos.x)<200&&Math.abs(e.pos.y-player.pos.y)<150){
                        e.count++
                        console.log(e.timer)
                        e.timer = rand(7-dex)+(4-(dex/2))
                        e.play('open', {loop:false, speed:30})
                        wait(.25, ()=>{
                            //console.log(count)
                            add([
                                sprite(e.sprite), 
                                area({width:20, height:30}), 
                                pos(e.pos.x, e.pos.y+16),
                                body(), 
                                origin('bot'), 
                                health(e.hp),
                                state('run', ["idle", "attack", "run", "jump", "hit", "die"]), 
                                'enemy', 
                                {init:false, str:e.str, timer:1, dir:1, parent:e, dex:e.dex}
                            ])    
    
                        })
                    }
                 }
            })
            onUpdate('background', (b)=>{
                b.moveTo(camPos())
            })
            onUpdate('enemy', (enemy)=>{
                if(player.pos.x>enemy.pos.x){
                    enemy.dir=1
                }else{
                    enemy.dir=-1
                }

                enemy.flipX(enemy.dir==-1);
                if(!enemy.init){
                    enemy.init = true;

                    enemy.onStateEnter("idle", () => {
                        enemy.play('idle')
                    })
                    enemy.onStateEnter("attack", () => {
                        enemy.play('attack', {speed:20})
                    })
                    enemy.onStateEnter("run", () => {
                        enemy.play('run')
                    })
                    enemy.onStateEnter("hit", () => {
                        enemy.play('hit')
                    })
                    enemy.onStateEnter("die", () => {
                        enemy.play('die')
                    })
                    enemy.onAnimEnd("attack", () => {
                        enemy.enterState('idle') 
                        if((player.state.indexOf('attack')==-1)&&Math.abs(enemy.pos.x-player.pos.x)<(enemy.width/2)&&Math.abs(enemy.pos.y-player.pos.y)<30){
                            player.hurt(enemy.str)
                            player.timer=rand(player.con-enemy.str)*.5
                            player.enterState('hit')
                        }
                    })        
                    enemy.onAnimEnd("hit", () => {
                        enemy.enterState('idle')       
                    })        

                    enemy.onAnimEnd("die", () => {
                        if(count) count-=1    
                        enemy.height = 0
                        console.log(count)
                        wait(10,()=>{
                            destroy(enemy)
                        })
                    })        
                    enemy.on("death", () => {
                        //destroy(enemy)
                        setTimeout(()=>{
                            enemy.solid = false;
                            addTears(enemy.str)
                        },100)
                        enemy.dead = true
                        enemy.play('die')
                    })
                    enemy.enterState('run')        
                }
                if(player.dangerous&&(!enemy.dead&&enemy.state!='hit'&&Math.abs(enemy.pos.x-player.pos.x)<(rangeAdj)+(player.width/2)*(size*.5)&&Math.abs(enemy.pos.y-player.pos.y)<80)){
                    setTimeout(()=>{
                        enemy.enterState('hit')
                        player.dangerous = false;
                        enemy.timer = .25
                        let attackMul = parseInt(player.state.split('-')[1])||1
                        //console.log(player.state.split('-'))
                        enemy.hurt(str*attackMul)
                        //console.log(str+'x'+attackMul+'='+str*attackMul+'='+enemy.hp())    
                    },10)

                }
                if(enemy.timer<0&&!enemy.dead&&(enemy.state=='idle'||enemy.state=='run')&&Math.abs(enemy.pos.x-player.pos.x)<(enemy.width/2)-10&&Math.abs(enemy.pos.y-player.pos.y)<80){
                    enemy.timer = .5-(enemy.dex*.1)
                    enemy.enterState('attack')
                }
                if(enemy.timer<0&&!enemy.dead&&(enemy.state=='idle'||enemy.state=='run')&&Math.abs(enemy.pos.x-player.pos.x)<300&&Math.abs(enemy.pos.y-player.pos.y)<80){
                    enemy.timer = .5
                    //console.log('run')
                    //enemy.dir=enemy.dir*-1
                    enemy.enterState('run')
                }
                if(enemy.state=='run'&&Math.abs(enemy.pos.x-player.pos.x)<5){
                    enemy.enterState('idle')
                }
                enemy.timer-=dt();
                if(enemy.state=='run'){
                    enemy.move(enemy.dir*150,0)
                }
            })  
            
            const player = add([
                sprite(key, {anim:'idle'}),
                pos(250,50),
                area({width:20, height: size*20}),
                solid(),
                body(),
                health(con*5),
                origin('bot'),
                scale(size*.5),
                state("idle", ["idle", "attack-1", "attack-2", "attack-3", "run", "jump", "hit"],
               ),
                
            ])

            player.onStateEnter("idle", () => {
                player.flipX(player.turned);
                player.dangerous = false;
                player.play("idle")               
            })
            player.onStateEnter("run", () => {
                player.flipX(player.turned);
                if(player.isGrounded()) player.play("run")               
            })
            player.onStateEnter("hit", () => {
                player.flipX(player.turned);
                player.play("hit",{
                    loop:false,

                })               
            })

            player.onAnimEnd("hit", () => {
                // You can also register an event that runs when certain anim ends
                player.flipX(player.turned);
                player.enterState('idle')
                console.log('test')
            })
            player.onAnimEnd("attack-1", () => {
                // You can also register an event that runs when certain anim ends
                player.flipX(player.turned);
                player.dangerous = false;
                player.enterState(player.nextState)
                player.nextState = 'idle';

            })
            player.onAnimEnd("attack-2", () => {
                // You can also register an event that runs when certain anim ends
                player.flipX(player.turned);
                player.dangerous = false;
                player.enterState(player.nextState)
                player.nextState = 'idle';

            })
            player.onAnimEnd("attack-3", () => {
                // You can also register an event that runs when certain anim ends
                player.flipX(player.turned);
                player.dangerous = false;
                player.enterState(player.nextState)
                player.nextState = 'idle';
                player.timer = .7-(dex*.1)

            })
            player.onStateEnter("attack-1", () => {
                // enter "idle" state when the attack animation ends
                player.flipX(player.turned);
                setTimeout(()=>{
                    player.dangerous = true;
                },550-(dex*100))
                player.play("attack-1", {
                    loop:false,
                    speed:3+dex*2
                })
            })
            player.onStateEnter("attack-2", () => {
                // enter "idle" state when the attack animation ends
                player.flipX(player.turned);
                setTimeout(()=>{
                    player.dangerous = true;
                },550-(dex*100))
                player.play("attack-2", {
                    loop:false,
                    speed:3+dex*2
                })
            })
            player.onStateEnter("attack-3", () => {
                // enter "idle" state when the attack animation ends
                player.flipX(player.turned);
                setTimeout(()=>{
                    player.dangerous = true;
                },550-(dex*100))
                if(player.doShake){
                    setTimeout(()=>{
                        shake()
                    },100)
                    player.doShake = false
                }
                player.play("attack-3", {
                    loop:false,
                    speed:3+dex*2

                })
                //console.log(player.width)
            })
            player.on("death", () => {
                //destroy(enemy)
                wait(3, ()=>{
                    music.stop()
                    go('mansion', { level: 1, startX: 1188, startY:216, newGame:true, newGameMsg:'My creation was a success! Who\'s the nerd now?? After extracting the tears of those miserable villiagers I have '+gamestate.tears+' tears in the resevoir! Hrm now wherever is the blasted thing..' })
                })
            })

            player.onCollide('ground', ()=>{
                if(!cardExists){
                    card(`Name:\t${name}\nType:\t${type}\nStr:${str}\nCon:${con}\nDex:${dex}\nSpd:${spd}`,
                        player, 
                        vec2(player.pos.x-(player.width/2), player.pos.y-(player.height/2+100))
                    )
                }
                if(player.state=='attack-3'){
                    if(player.doShake) shake()
                    player.doShake=false;
                }else if(player.state!='run'){
                        player.enterState('idle')
                }else if(player.jumping){
                    player.jumping = false;
                    player.play('run')
                }
            })
            player.onUpdate(()=>{
                player.timer -= dt()
                if (!isKeyDown("right")&&!isKeyDown("left")&&player.state=='run') {
                    player.enterState('idle')
                } else if((isKeyDown("right")||isKeyDown("left"))&&player.state=='idle'){
                    if(player.timer<=0)player.enterState('run')
                }
                let xspeed = 0;
                if(player.state=='run'){
                    xspeed = (player.turned?-spd*50:spd*50)
                }
                if(player.vx&&Math.abs(player.vx)>1){
                    xspeed += player.vx; 
                    player.vx *= .7
                }else{
                    player.vx = 0
                }
                player.move(xspeed,0)
                camPos(player.pos.x+width()/4, player.pos.y-height()/6)
            })
            onKeyPress('space', () => {
                if(player.timer>0) return
                if(!player.isGrounded() && player.state!='attack-3' && player.state!='hit') {
                    player.nextState = 'idle';
                    player.enterState("attack-3")
                    if(specials.jumping){
                        if(specials.jumping.jump){
                            player.jump(370)
                        }
                        if(specials.jumping.lunge){
                            player.vx = (dex*150)*(player.turned?-1:1);
                        }
                        if(specials.jumping.pound){
                            player.doShake=true;
                        }    
                    }

                }else if(player.state=='idle'||player.state=='run') {
                    player.nextState = 'idle';
                    player.enterState("attack-1")
                }else if(player.state=='attack-1'){
                    player.nextState = 'attack-2';
                }else if(player.state=='attack-2'){
                    player.nextState = 'attack-3';
                    if(isKeyDown("down") && specials.standing && specials.standing.pound){
                        player.doShake=true;
                    }    

                }else if(player.state=='attack-3'){
                    if(isKeyDown("down")){
                        if(specials.standing){
                            if(specials.standing.jump && player.isGrounded()){
                                player.jump(150+(dex*100))
                            }
                            if(specials.standing.attack){
                                player.nextState = 'attack-3';
                            }
                            if(specials.standing.lunge){
                                player.vx = (dex*150)*(player.turned?-1:1);
                                console.log('lunge')
                            }
                        }
                    }
                    //player.nextState = 'attack-3';
                }
                //console.log(player.state)
                //console.log(player.nextState)
            })
            onKeyPress('up', () => {
                if(player.timer>0) return
                if(!player.isGrounded()) return
                player.jump(150+(dex*100));
                player.jumping = true;
                if(player.state=='idle'||player.state=='run'){
                    player.play('jump',{loop:false})
                }
            })
            onKeyPress('left', () => {
                player.turned = true;
            })
            onKeyPress('right', () => {
                player.turned = false;
            })
            onKeyPress(['right', 'left'], () => {
                if(player.timer>0) return
                player.flipX(player.turned)
                if(player.state=='idle'){
                    player.enterState("run")
                }else{
                    //player.nextState = 'run';
                }
            })
    
    })
    scene('title', ()=>{
        const music = play("title", {
            volume: 0.5,
            loop: true
        })
        const title = add([
            sprite('title'),
            pos(0, -200),
            scale(.75),
            opacity(0)
        ])
        title.onUpdate(()=>{
            title.opacity+=.01
            if(title.pos.y<0){
                title.pos.y+=.25;
            } 
        })
        const message = "Use the arrow keys and spacebar to select an option."
        const imessage = `INSTRUCTIONS
You are The Doctor, an evil, immortal being that lives high above the villagers in the Monster Mansion. You must solve the riddles of the mansion to configure the Monster Maker Machine and unleash a unique playable creature on the villagers below. Extract the misery of the villagers to fill the Reservoir of Tears and expand your own magical powers.

Use the arrow keys to move and space for spells or attack.        

Press space to continue.`
        const cmessage = `CREDITS
Title screen image: Markiin Bellucci (Reddit user u/markiin05)`
        
        const instructiontext = add([
            text(imessage,{
                size: 12,
                width:350
            }),
            pos(-1000, 10),
        ])
        instructiontext.onUpdate(()=>{
            if(instructiontext.pos.y>10){
                instructiontext.pos.y-=60;
            }else{
                instructiontext.pos.y=10;
            }
        })
        const credittext = add([
            text(cmessage,{
                size: 12,
                width:350
            }),
            pos(-1000, 10),
            
        ])
        credittext.onUpdate(()=>{
            if(credittext.pos.y>10){
                credittext.pos.y-=60;
            }else{
                credittext.pos.y=10;
            }
        })
                                
        //onKeyPress('space', () => {
        //    music.stop()
        //    go ('mansion', { level: 0, startX: 192, startY:216, newGame:true })
        //})
        const t = []
        let selected = 0;
        let cursor
        let ichoices = ["Start", "Instructions", "Credits"]
        let p = {x:175, y:250}
        onKeyPress('up', () => {
            keystate = 'up'
        })
        onKeyPress('down', () => {
            keystate = 'down'
        })
        onKeyPress('space', () => {
            if(!dialogOpen){
                keystate = ''
                instructiontext.moveTo(-1000,10)
                credittext.moveTo(-1000,10)
                showMenu(ichoices)
            }else{
                keystate = 'space'
            }
        })
        function showMenu(choices){
            dialogOpen = true
            const logo = add([
                sprite('logo'),
                pos(35,400),
                scale(1.5),


            ])
            logo.onUpdate(()=>{
                if(logo.pos.y>15){
                    logo.pos.y-=.5;
                }
            })
    
            t.push(add([
                text(message,{
                    size: 12,
                    width:300
                }),
                pos(p.x, p.y-(choices&&choices.length?40:8)),
                origin('center')
            ]))
            if(choices&&choices.length){
                cursor = add([
                    text('>>>',
                    {
                        size: 12,
                        width:300
                    }),
                    pos(p.x-70, p.y+((12*selected))),
                    origin('center')
                ])
                t.push(cursor)
                choices.forEach((choice, i)=>{
                    t.push(add([
                        text(choice ,{
                            size: 12,
                            width:300
                        }),
                        pos(p.x, p.y+((12*i))),
                        origin('center')
                    ]))
                })
            }
            wait(.5,()=>{
                keystate=''
                let keyInterval = setInterval(()=>{
                    if(cursor){
                        cursor.moveTo(p.x-70, p.y+((12*selected)))
                    }else{
                        console.log('Cursor not found')
                    }
                    if(keystate == 'down'){
                        keystate =''
                        selected++
                        if(choices && selected == choices.length){
                            selected = 0
                        }
                    }else if(keystate == 'up'){
                        keystate =''
                        selected--
                        if(selected < 0 && choices){
                            selected = choices.length-1
                        }
                    }else if(keystate == 'space'){
                        keystate =''
                        clearInterval(keyInterval)
                        //destroy(b)
                        t.forEach(t=>{
                            destroy(t)
                        })
                        wait(.1,()=>{
                            dialogOpen = false
                            console.log(selected)
                            if(selected===0){
                                go ('mansion', { level: 0, startX: 192, startY:216, newGame:true })
                            }else if(selected===1){
                                dialogOpen = false
                                destroy(logo)
                                instructiontext.moveTo(10,310)
                            }else if(selected===2){
                                dialogOpen = false
                                destroy(logo)
                                credittext.moveTo(10,310)
                            }
                        })
                    } else {
                    }
                }, 1) 
            })
        }
        showMenu(ichoices)
    })
    //go('village', monsterMapping['0100'])
    //if(('ontouchstart' in window) ||
    //(navigator.maxTouchPoints > 0) ||
    //(navigator.msMaxTouchPoints > 0)){
    //    alert('This game is available on Desktop Only')
    //    window.location.href = '..'
    //} else{
        go('title')
    //}

