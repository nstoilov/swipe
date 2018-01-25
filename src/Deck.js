import React, { Component } from 'react';
import {
    View,
    Animated, // for complex animation tied to gesures
    PanResponder, //gensture handling
    Dimensions, //gets screen dimensions
    LayoutAnimation, //for simple 'a to b' animations
    UIManager //for LayoutAnimation for android
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

 //default onSwipe functions in 
    //case they are not passed down as props (which they are not - nothing happens on swipe)
class Deck extends Component {
    static defaultProps = {
        onSwipeRight: () => { },
        onSwipeLeft: () => { }
    }

    constructor(props) {
        super(props); //allowing access to this.props in the constructor
        const position = new Animated.ValueXY(); //assigning the Animated position of the component to a variable
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => { //when there is a gesture, track the lenght of the movement
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) { // if the movement is bigger than the treshold, do forceSwipe
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition(); //if it's smaller than the threshold, reset the position
                }
            }

        });

        this.state = { panResponder, position, index: 0 };
        // add panresponder, position and an index to the state
    }

    componentWillReceiveProps(nextProps) { //reset the index when the data set is changed
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0 });
        }
    }

    componentWillUpdate() { //when the component updates animate the change with spring
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    //triggered after a force swipe. calls onSwipeRight or Left (if any). Resets position in the state. Increments index
    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
    }

    //maps rotation to movement
    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        };
    }
//animates swipe to left/right, triggers onswipecomplete. x is set to + - screenwidth
    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: { x, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }
//if the swipe treshold is not reached resets card position 
    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: { x: 0, y: 0 }
        }).start();
    }

    renderCards() {
        if (this.state.index >= this.props.data.length) { //if the exceeds the dataset length call rendernomorecards
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, i) => { //i is the fucking element index (1)
            if (i < this.state.index) { return null; }//if card is old (I guess) don't render it. 

            if (i === this.state.index) { //jackpot, state index equals element intex. We display it. This is what map is for.
                return ( //does the thing
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyle, { zIndex: 1 }]} //android specific thing to put card on top
                        {...this.state.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }
            return ( //that's for the rest of the cards with i > index, they are displayed under and slightly below the rest.
                <View 
                key={item.id}
                style={[styles.cardStyle, { top: 10 * (i - this.state.index) }]}
                >
                    {this.props.renderCard(item)}
                </View>
            );
        }).reverse(); //reverses the array resulting from map
    }
    render() {
        return (
            <Animated.View>
                {this.renderCards()}
            </Animated.View>
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        zIndex: 0
    }
};

export default Deck;
