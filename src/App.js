import './App.css';
import React, { Component } from 'react';
import socketIOClient from "socket.io-client";

const PLAY = 1
const PAUSE = 2
const RESET = 3
const SYNC = 4

class App extends Component {
  constructor(up) {
    super(up)
    this.isMaster = window.location.pathname === "/master"
    this.video = null
    this.socket = null
    this.timer = null
    this.state = {
      isPlaying: false
    }
    this.clicked = this.clicked.bind(this)
    this.update = this.update.bind(this)
  }

  componentDidMount() {
    if (!this.socket) {
      this.socket = socketIOClient(`${window.location.href}`)
      // this.socket = socketIOClient(`http://localhost:4001`)
      this.socket.on("clicked", (e) => {
        console.log("clicked")
        return this.update(e)
      })

      this.socket.on("init", (e) => {
        console.log("init", e)
        return this.update(e)
      })
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      return this.socket.close()
    }
  }

  update(e) {
    console.log("update with", e)
    let isPlaying = this.state.isPlaying
    if (e.state === PLAY) {
      this.video.play()
      isPlaying = true
    } else if (e.state === PAUSE) {
      this.video.pause()
      isPlaying = false
    } else if (e.state === RESET) {
      this.video.currentTime = 0
      isPlaying = false
    } else if (e.state === SYNC) {
      if(this.state.isPlaying !== e.isPlaying) {
        console.log("Sync required: Play state", this.state.isPlaying, "vs", e.isPlaying)
        isPlaying = e.isPlaying
        if (e.isPlaying) {
          this.video.play()
        } else {
          this.video.pause()
        }
      }
      if (Math.abs(this.video.currentTime - e.currentTime) > .1) {
        console.log("Sync required: Time", this.video.currentTime, "vs",  e.currentTime)
        this.video.currentTime = e.currentTime
      }
    }
    const newState = {
      isPlaying
    }
    this.setState(newState)
    console.log("updated", newState)
  }

  clicked(state) {
    console.log("clicked")
    if (this.isMaster) {
      let e  = {
        currentTime: state === RESET ? 0 : this.video.currentTime,
        state
      }
      console.log("emit clicked", e)
      this.socket.emit("clicked", e)
      if (this.timer) {
        clearInterval(this.timer)
      }
      this.timer = setInterval(() => {
        this.socket.emit("clicked", {
          state: SYNC,
          isPlaying: this.state.isPlaying,
          currentTime: this.video.currentTime
        })
      }, 1000);
    }
  }

  render() {
    let video = () => {
      return (
        <video
          id="my-video"
          className="Video video-js"
          onPause={() => this.clicked(PAUSE)}
          onPlay={() => this.clicked(PLAY)}
          ref={(c) => { this.video = c }}
          preload="auto"
          data-setup="{}"
          controls>
          {/* <source src="https://raw.githubusercontent.com/anandkumarpatel/screen-share/master/movie/playlist.m3u8" type="video/x-mpegURL"></source> */}
          <source src={window.location.href + "movie/playlist.m3u8"} type="video/x-mpegURL"></source>
        </video>
      )
    }


    return (
      <div className="App">
        {video()}
      </div>
    );
  }
}

export default App;
