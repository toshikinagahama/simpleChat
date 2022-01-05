import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { userState, socketState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function User(pageProps) {
  const [user, setUser] = useRecoilState(userState);
  const [socket, setSocket] = useRecoilState(socketState);
  const [message, setMessage] = useState('');
  useEffect(() => {
    console.log(user);
  }, []);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendBtnClick = async (e) => {
    let json_data = {
      message,
      command: '1',
      user_id: user.ID,
    };
    socket.send(JSON.stringify(json_data));
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
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Home</title>
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="m-4 w-full">
          <p>Hi! {user.Name}</p>
        </div>
        <textarea className="border-2 w-full" value={message} onChange={handleMessageChange} />
        <div className="m-8">
          <button className="text-2xl" onClick={handleSendBtnClick}>
            送信
          </button>
        </div>
      </main>
    </div>
  );
}
