import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState, messagesState } from '../../components/atoms';
import { useRecoilState } from 'recoil';
import Image from 'next/image';
import { human_icon, domain_db } from '../../global';
import Auth from '../../components/auth';
import MyNav from '../../components/nav';

export default function Room(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);
  const [room_users, setRoom_users] = useState([]);
  const socketRef = useRef();
  const refRoom_users = useRef([]);
  const refMessageObjs = useRef([]);
  const room_id = router.query.id;
  const bottomDivRef = useRef(null);

  const [isFetchData, setIsFetchData] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [message_send, setMessage_send] = useState('');
  const [messageObjs, setMessageObjs] = useState([]);

  useEffect(async () => {
    // if (socketRef.current != null) return;
    const token = localStorage.getItem('token');
    socketRef.current = new WebSocket(`ws://${domain_db}/ws`);

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
        const res = await fetch(`http://${domain_db}/restricted/get_rooms`, {
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

              res = await fetch(`http://${domain_db}/restricted/get_roomusers`, {
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
                res = await fetch(`http://${domain_db}/restricted/get_messages`, {
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
  }, [rooms, messageObjs, bottomDivRef, user, room_users]);

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

  return (
    <Auth>
      {user == null ? (
        <div>loading</div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen w-screen">
          <Head>
            <title>部屋一覧</title>
          </Head>

          <MyNav title={room_id} />

          <main className="flex flex-col items-center justify-start w-full flex-1 container bg-zinc-100 pt-4 pb-40">
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
                          <p className="text-sm">{messageObj.text}</p>
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
                      <p className="text-sm">{messageObj.text}</p>
                    </div>
                  </div>
                );
              }
            })}
            <div ref={bottomDivRef}></div>
          </main>
          <div className="sticky bottom-0 container">
            <div className="my-2">
              <div className="flex w-full justify-end">
                <input
                  className="border-2 flex-grow mx-2 py-2 px-2"
                  value={message_send}
                  onChange={handleMessageChange}
                />
                <button
                  className="text-sm w-12 bg-neutral-800 rounded-md mx-2 text-white"
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
