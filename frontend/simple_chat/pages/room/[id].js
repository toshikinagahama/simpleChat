import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState } from '../../components/atoms';
import { useRecoilState } from 'recoil';
import { human_icon, domain_db, http_protcol, ws_protcol } from '../../global';
import Auth from '../../components/auth';
import MyNav from '../../components/nav';

export default function Room(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);
  const [room_users, setRoom_users] = useState([]);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef();
  const refRoom_users = useRef([]);
  const refMessageObjs = useRef([]);
  const room_id = router.query.id;
  const bottomDivRef = useRef(null);

  const [isFetchData, setIsFetchData] = useState(false);
  const [room, setRoom] = useState([]);

  const [message_send, setMessage_send] = useState('');
  const [messageObjs, setMessageObjs] = useState([]);

  useEffect(async () => {
    // if (socketRef.current != null) return;
    const token = localStorage.getItem('token');
    socketRef.current = new WebSocket(`${ws_protcol}://${domain_db}/ws`);

    socketRef.current.addEventListener('open', function (e) {
      socketRef.current.send(JSON.stringify({ command: 0, data: { token } }));
    });

    // サーバーからデータを受け取る
    socketRef.current.addEventListener('message', function (e) {
      try {
        const json_data = JSON.parse(e.data);
        const command = json_data['command'];
        if (command != null) {
          switch (command) {
            case 1:
              console.log(json_data['message']);
              const m = json_data['message'];
              let tmp_user = refRoom_users.current.filter((u) => u.id === m.user_id);
              tmp_user = tmp_user[0];
              if (tmp_user != null) {
                let m_new = {
                  text: m.text,
                  from_id: tmp_user.id,
                  from: tmp_user.name,
                  icon: tmp_user.icon,
                  timestamp: new Date(),
                };
                setMessageObjs([...refMessageObjs.current, m_new]);
              } else {
                console.log('no valid user');
              }

              // setMessages([...refMessages.current, json_data['data']]);
              // console.log(refMessages.current);
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.log(error);
      }
    });

    return () => {
      console.log('Disconnecting..');
      socketRef.current.close();
      // removeListeners?.();
    };
  }, []);

  useEffect(() => {
    if (user == null) {
      return;
    }

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!isFetchData) {
        const res = await fetch(`${http_protcol}://${domain_db}/restricted/get_rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            room_ids: [room_id],
          }),
        }).catch(() => null);
        if (res != null) {
          const json_data = await res.json().catch(() => null);
          // console.log(json_data);
          if (json_data['result'] != null) {
            if (json_data['result'] === 0) {
              setIsFetchData(true);
              const res_rooms = json_data['rooms'];
              setRoom(res_rooms[0]);

              res = await fetch(`${http_protcol}://${domain_db}/restricted/get_roomusers`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  room_id: room_id,
                }),
              }).catch(() => null);
              if (res != null) {
                const json_data = await res.json().catch(() => null);
                // console.log(json_data);
                setRoom_users(json_data['users']);
                const tmp_room_users = json_data['users'];
                res = await fetch(`${http_protcol}://${domain_db}/restricted/get_messages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    room_ids: [room_id],
                  }),
                }).catch(() => null);
                if (res != null) {
                  const json_data = await res.json().catch(() => null);
                  // console.log(json_data);
                  if (json_data['result'] != null) {
                    if (json_data['result'] === 0) {
                      setMessageObjs([]);
                      let messageObjs_new = [...messageObjs];
                      json_data['messages'].map((m, index) => {
                        //そのメッセージの人のデータを取得
                        let tmp_user = tmp_room_users.filter((u) => u.id === m.user_id);
                        tmp_user = tmp_user[0];
                        if (tmp_user != null) {
                          let m_new = {
                            text: m.text,
                            from_id: tmp_user.id,
                            from: tmp_user.name,
                            icon: tmp_user.icon,
                            timestamp: new Date(m.CreatedAt),
                          };
                          messageObjs_new.push(m_new);
                        } else {
                          console.log('no valid user');
                        }
                      });

                      setMessageObjs(messageObjs_new);
                    }
                  }
                }
              }

              // console.log(res_rooms);
            }
          }
        }
      }
    };
    fetchData();
    if (bottomDivRef.current != null) bottomDivRef.current.scrollIntoView();
  }, [room, messageObjs, bottomDivRef, user, room_users]);

  useEffect(() => {
    refRoom_users.current = [...room_users];
  }, [room_users]);

  useEffect(() => {
    refMessageObjs.current = [...messageObjs];
  }, [messageObjs]);

  const handleMessageChange = (e) => {
    setMessage_send(e.target.value);
  };

  const handleSendBtnClick = async (e) => {
    console.log('hello');
    socketRef.current.send(
      JSON.stringify({
        command: 1,
        message: { room_id: room_id, user_id: user.id, text: message_send },
      })
    );
    setMessage_send('');
    bottomDivRef.current.scrollIntoView();
  };

  const calcTextAreaHeight = (value) => {
    let rowsNum = message_send.split('\n').length;
    if (rowsNum >= 10) rowsNum = 10;
    return rowsNum;
  };

  return (
    <Auth>
      {user == null ? (
        <div>loading</div>
      ) : (
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 font-mono flex flex-col items-center justify-center min-h-screen w-screen">
          <Head>
            <title>部屋一覧</title>
            <meta httpEquiv="cache-control" content="no-cache" />
            <meta httpEquiv="expires" content="0" />
            <meta httpEquiv="pragma" content="no-cache" />
          </Head>

          <MyNav title={room.name} />
          <div className="m-4"></div>

          <main className="flex flex-col items-center justify-start w-full flex-1 container bg-slate-50 bg-opacity-40 pt-4 pb-40">
            {messageObjs.map((messageObj, index) => {
              if (messageObj.from_id != user.id) {
                //自分以外
                return (
                  <div className="flex justify-start w-full pr-8 py-2" key={index}>
                    <div className="">
                      <div className="w-10 h-10 shadow-lg rounded-full p-2 mx-2">
                        {messageObj.icon == '' ? (
                          <img src={human_icon} alt={''} width={80} height={80} />
                        ) : (
                          <img src={messageObj.icon} alt={''} width={80} height={80} />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-start">
                      <div className="text-xs">{messageObj.from}</div>
                      <div className="flex">
                        <div className="bg-zinc-500 text-white rounded-xl px-2 py-1 my-auto">
                          <p className="text-sm whitespace-pre-wrap">{messageObj.text}</p>
                        </div>
                        <div className="ml-2 flex flex-col justify-end">
                          <p className="text-xs">
                            {`${('0' + messageObj.timestamp.getHours()).slice(-2)}:${(
                              '0' + messageObj.timestamp.getMinutes()
                            ).slice(-2)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                //自分
                return (
                  <div className="flex justify-end w-full pl-8 pr-4 py-2" key={index}>
                    <div className="mr-2 flex flex-col justify-end">
                      <p className="text-xs">
                        {`${('0' + messageObj.timestamp.getHours()).slice(-2)}:${(
                          '0' + messageObj.timestamp.getMinutes()
                        ).slice(-2)}`}
                      </p>
                    </div>
                    <div className="bg-green-300 rounded-xl px-2 py-1 my-auto">
                      <p className="text-sm whitespace-pre-wrap">{messageObj.text}</p>
                    </div>
                  </div>
                );
              }
            })}
            <div ref={bottomDivRef}></div>
          </main>
          <div className="bg-slate-50 bg-opacity-40 sticky bottom-0 container">
            <div className="my-2">
              <div className="flex w-full justify-end items-end">
                <textarea
                  className="border-0 rounded-xl flex-grow mx-2 py-2 px-2"
                  rows={calcTextAreaHeight(message_send)}
                  value={message_send}
                  onChange={handleMessageChange}
                  onCompositionStart={() => {
                    setTyping(true);
                  }}
                  onCompositionEnd={() => {
                    setTyping(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.shiftKey) {
                      if (e.key == 'Enter') {
                      }
                    } else {
                      if (!typing) {
                        if (e.key == 'Enter') {
                          e.preventDefault();
                          handleSendBtnClick();
                        }
                      }
                    }
                  }}
                />
                <button
                  className="text-sm w-12 bg-neutral-800 rounded-md mx-2 py-2 text-white"
                  onClick={handleSendBtnClick}
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Auth>
  );
}
