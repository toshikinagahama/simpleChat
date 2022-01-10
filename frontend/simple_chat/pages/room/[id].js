import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState, socketState } from '../../components/atoms';
import { useRecoilState } from 'recoil';
import Image from 'next/image';
import Auth from '../../components/auth';
import MyNav from '../../components/nav';

export default function Room(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);
  const [socket, setSocket] = useRecoilState(socketState);
  const [message, setMessage] = useState('');
  const [isShowMenuContent, setIsShowMenuContent] = useState(true);
  const room_name = router.query.id;
  const bottomDivRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      text: 'おはよー。今日はとても気分がいいのでどこかにでかけませんか！',
      from_id: 'hama1',
      from: 'hama1',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      timestamp: new Date(),
    },
    {
      text: 'おはよー!',
      from_id: '1',
      from: 'toshiki',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      timestamp: new Date(),
    },
    {
      text: 'おはよー!!!',
      from_id: '1',
      from: 'hama1',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      timestamp: new Date(),
    },
    {
      text: 'おはよー!!!!!!',
      from_id: 'hama1',
      from: 'hama1',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (window.innerWidth >= 672) {
      setIsShowMenuContent(true);
    } else {
      setIsShowMenuContent(false);
    }
  }, []);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendBtnClick = async (e) => {
    let json_data = {
      message,
      command: '1',
      user_id: user.id,
    };
    setMessages([
      ...messages,
      {
        text: message,
        from: user.name,
        from_id: user.id,
        icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
        timestamp: new Date(),
      },
    ]);
    bottomDivRef.current.scrollIntoView();
    // socket.send(JSON.stringify(json_data));
    // const res = await fetch('http://localhost:1323/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     id: user.ID,
    //     message,
    //   }),
    // }).catch(() => null);
  };

  return (
    <Auth>
      <div className="flex flex-col items-center justify-center min-h-screen w-screen">
        <Head>
          <title>部屋一覧</title>
        </Head>

        <MyNav title={room_name} />

        <main className="flex flex-col items-center justify-start w-full flex-1 container bg-zinc-100 pt-4 pb-40">
          {messages.map((message, index) => {
            if (message.from_id != user.id) {
              //自分以外
              return (
                <div className="flex justify-start w-full pr-8 py-2" key={index}>
                  <div className="">
                    <div className="w-10 h-10 shadow-lg rounded-full p-2 mx-2">
                      <img src={message.icon} alt={''} width={80} height={80} />
                    </div>
                  </div>
                  <div className="flex flex-col justify-start">
                    <div className="text-xs">{message.from}</div>
                    <div className="flex">
                      <div className="bg-zinc-500 text-white rounded-xl px-2 py-1 my-auto">
                        <p className="text-sm">{message.text}</p>
                      </div>
                      <div className="ml-2 flex flex-col justify-end">
                        <p className="text-xs">
                          {`${('0' + message.timestamp.getHours()).slice(-2)}:${(
                            '0' + message.timestamp.getMinutes()
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
                      {`${('0' + message.timestamp.getHours()).slice(-2)}:${(
                        '0' + message.timestamp.getMinutes()
                      ).slice(-2)}`}
                    </p>
                  </div>
                  <div className="bg-green-300 rounded-xl px-2 py-1 my-auto">
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              );
            }
          })}
          <div ref={bottomDivRef}></div>
        </main>
        <div className="fixed bottom-0 left-0">
          <div className=" w-full my-2 flex">
            <input
              className="border-2 flex-grow mx-2 text-xs py-2 px-2"
              value={message}
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
    </Auth>
  );
}
