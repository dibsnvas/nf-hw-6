import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import axios from "axios";
import "./App.css";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatParticipants, setChatParticipants] = useState([]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    socket.emit("typing", { room, username, typing });
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("update_user_list", (users) => {
      setUserList(users);
    });
  }, [socket]);

  useEffect(() => {
    socket.emit("join_room", { room, username });

    window.addEventListener("beforeunload", () => {
      socket.disconnect();
    });

    axios.get(`/api/chat/${room}`)
      .then(response => {
        setChatParticipants(response.data.participants);
      })
      .catch(error => {
        console.error("Error fetching chat data:", error);
      });

    return () => {
      window.removeEventListener("beforeunload", () => {
        socket.disconnect();
      });
    };
  }, [socket, room, username]);

  return (
    <div className="chat-container">
      <div className="user-list">
        <h3>Users</h3>
        <ul>
          {userList.map((user) => (
            <li key={user.id} className="user-item">
              <span className={`user-status ${user.typing ? "typing" : "online"}`}></span>
              {user.username} {user.typing && "is typing..."}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-window">
        <div className="chat-header">
          <p>Live Chat</p>
        </div>
        <div className="chat-body">
          <ScrollToBottom className="message-container">
            {messageList.map((messageContent, index) => (
              <div key={index} className="message" id={username === messageContent.author ? "you" : "other"}>
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollToBottom>
        </div>
        <div className="chat-footer">
          <input
            type="text"
            value={currentMessage}
            placeholder="What's cooking, good looking"
            onChange={(event) => {
              setCurrentMessage(event.target.value);
              handleTyping(event.target.value !== "");
            }}
            onKeyPress={(event) => {
              if (event.key === "Enter") {
                sendMessage();
                handleTyping(false);
              }
            }}
            onBlur={() => handleTyping(false)}
          />
          <button onClick={sendMessage}>&#9658;</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
