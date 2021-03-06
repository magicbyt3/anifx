'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Fx {
	animations = 'color: [randomColor, randomColor]';
	node;
	timing = {
    duration: 1500,
    easing: 'linear',
    fill: 'none',
    direction: 'normal',
    iterations: 1
  };
	delay = 0;
	delayBetweenLetters = 0;
	clean = true;
	retain = false;
	currentLineLen = 0;
	randomColor = () => {
		return "#xxxxxx".replace(/x/g, y=>(Math.random()*16|0).toString(16));
	}
	getAnimations = function(str) {
		return str
			.split('|')
			.map(keyVal => {
				return keyVal
					.split(':')
					.map(s => s.trim());
				})
				.reduce((accumulator, currentValue) => {
					accumulator[currentValue[0]] = currentValue[1]
						.replace('[', '')
						.replace(']', '')
						.split(', ').map(val => {
							return val.replace('randomColor', this.randomColor())
						});
					return accumulator;
				}, 
			{}
		);
	}
	cleanUp = function(node) {
		if ('false' !== this.retain) {
			// get values to retain
			let retainerObj = {};
			this.retain.split(', ').forEach((retainProp) => {
				const MATCHES = retainProp.split(/\[(.*?)\]/);
				if (undefined !== this.animations[MATCHES[0]]) {
					const RVALUE = this.animations[MATCHES[0]][this.animations[MATCHES[0]].length - 1];
					retainerObj[MATCHES[0]] = RVALUE;
				}
			});
			Object.assign(node.style, retainerObj);
		}

		let text = '';
		Array.from(node.childNodes).forEach((child) => {
			if('A' === child.tagName) {
				const aSpans = child.querySelectorAll('span');
				aSpans.forEach((s) => {
					child.append(s.innerText);
					s.remove();
				});

				text += child.outerHTML;
			} else {
				if ('#text' !== child.nodeName) {
					text += 0 === child.innerText.length ? ' ' : child.innerText;
					child.remove();
				} else {
					text = child.textContent;
				}
			}
		});
		node.innerHTML = text.trim();
	}
	animateNode = function(node, options) {
		if (options.timing?.iterations < 1) {
			options.timing.iterations = Infinity;
		}

		this.node = node;
		this.delayBetweenLetters = options.delayBetweenLetters || this.delayBetweenLetters;
		this.timing = options.timing || this.timing;
		this.delay = options.timing.delay || this.delay;
		this.clean = options.clean || this.clean;
		this.retain = options.retain || this.retain;
		this.animations = this.getAnimations(options.animationString);
		
		if (true === options.split) {
			this.runSplitAnimations(node);
		} else {
			this.runFullAnimations(node);
		}
	}
	lastElementCb = function(node, current, last) {
		if (current === last - 1) {
			this.cleanUp(node);
			node.isAnimating = false;
		}
	}
	runFullAnimations = function(xEl) {
		const anim = xEl.animate(this.animations, this.timing);
		anim.onfinish = ((e) => {
			xEl.isAnimating = false;
		});
	}
	runSplitAnimations = function(xEl) {
		let anim, currentAnchor = 0;
		const ANCHORS = xEl.querySelectorAll('a');
		if (null !== ANCHORS && ANCHORS.length > 0) {
			Array.from(ANCHORS).forEach((ANCHOR) => {
				xEl.textContent = xEl.textContent.replace(ANCHOR.innerText, '*');
			});
		}
		
		// remove empty && \n
		xEl.textContent = xEl.textContent.trim();
		const textInWords = xEl.textContent.split(' ');
		const animTargets = xEl.textContent.split('');

		xEl.textContent = '';


		const fontSize = parseFloat(window.getComputedStyle(xEl, null).getPropertyValue('font-size')) || 24;
		const containerWidth = xEl.clientWidth;
		let currentWordIndex = 0, 
			wordsLength = [],
			words = [];
		
		textInWords.map((word, index) => {
			const SHADOW_SPAN = document.createElement('span');
			SHADOW_SPAN.style.display = 'inline-block';
			
			// set proper anchor text to shadow span so width gets calculated correctly
			if ('*' === word) {
				SHADOW_SPAN.innerText = ANCHORS[currentAnchor].innerText;
				currentAnchor++;
			} else {
				SHADOW_SPAN.innerText = word;
			}

			wordsLength[index] = this.shadowCalc(xEl, SHADOW_SPAN);
			words[index] = word;
		});
		
		let currentLineNum = 0;
		textInWords.map((word, index) => {
			this.currentLineLen += wordsLength[index] + fontSize / 3.65;
			if (this.currentLineLen + wordsLength[index + 1] > containerWidth) {
				words.splice(index + currentLineNum + 1, 0, '<br>');
				this.currentLineLen = 0;
				currentLineNum++;
			}
		});

		// reset line counter and anchor
		currentLineNum = 0, currentAnchor = 0;

		animTargets.forEach((item, index) => {
			let runAnim = true;
			if ('*' === item) {
				let a = document.createElement('a');
				a.href = ANCHORS[currentAnchor].href;
				a.target = ANCHORS[currentAnchor].target;

				const ANCHORLETTERS = ANCHORS[currentAnchor].innerText.split('');
				ANCHORLETTERS.forEach((aLetter, letterIndex) => {
					const SPAN = document.createElement('span');
					SPAN.innerText = aLetter;
					SPAN.style.display = 'inline-block';

					if (' ' === item) {
						SPAN.style.width = `${fontSize / 3.65}px`;
						runAnim = false;
					}
					
					a.append(SPAN);

					anim = SPAN.animate(this.animations, {
						duration: this.timing.duration,
						easing: this.timing.easing,
						fill: this.timing.fill,
						direction: this.timing.direction,
						iterations: this.timing.iterations,
						delay: this.timing.delay + this.delayBetweenLetters * (index + letterIndex + 1)
					});
				});

				xEl.append(a);
				currentAnchor++;

				return;
			}

			if (item instanceof HTMLElement) {
				anim = item.animate(this.animations, this.timing);
                    
				if (true === this.clean) {
					anim.onfinish = ((e) => {
						this.lastElementCb(e.target, index, animTargets.length);
					});
				}
			} else {				
				let appendWhiteSpace = true;
				const SPAN = document.createElement('span');
				SPAN.style.display = 'inline-block';
				SPAN.innerText = item;		

				// move to next word if a space is found
				if (' ' === item) {
					SPAN.innerText = '';					
					SPAN.style.width = `${fontSize / 3.65}px`;
					runAnim = false;
					
					if ('<br>' === words[currentWordIndex + currentLineNum + 1]) {
						const BR = document.createElement('br');
						xEl.append(BR);
						currentLineNum++;
						appendWhiteSpace = false;
					}
					currentWordIndex++;
				}

				if (appendWhiteSpace) {
					xEl.append(SPAN);
				}

				if (true === runAnim) {
					anim = SPAN.animate(this.animations, {
						duration: this.timing.duration,
						easing: this.timing.easing,
						fill: this.timing.fill,
						direction: this.timing.direction,
						iterations: this.timing.iterations,
						delay: this.timing.delay + this.delayBetweenLetters * (index + 1)
					});
                    
					if (true === this.clean) {
						anim.onfinish = (() => {
							// anim.pause();
							this.lastElementCb(xEl, index, animTargets.length);
						});
					}
				}
			}
		});
	}
	shadowCalc = (xEl, el) => {
		// append el invisible, measure it's width and remove it right away
		el.style.visibility = 'hidden';
		xEl.append(el);
		const w = el.clientWidth;
		xEl.removeChild(el);
		
		return w;
	}
}

exports.Fx = Fx;
