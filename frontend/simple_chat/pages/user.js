import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { userState, socketState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function User(pageProps) {
  const [user, setUser] = useRecoilState(userState);
  const [socket, setSocket] = useRecoilState(socketState);
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState([
    { name: 'test1', icon: null, num_unread: 3, last_update: new Date() },
    { name: 'test1', icon: null, num_unread: 3, last_update: new Date() },
  ]);
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
        <title>部屋一覧</title>
      </Head>

      <nav class="flex items-center justify-between flex-wrap bg-teal p-6">
        <div class="flex items-center flex-no-shrink text-white mr-6">
          <span class="font-semibold text-xl tracking-tight">Tailwind CSS</span>
        </div>
        <div class="block lg:hidden">
          <button class="flex items-center px-3 py-2 border rounded text-teal-lighter border-teal-light hover:text-white hover:border-white">
            <svg class="h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>
        <div class="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
          <div class="text-sm lg:flex-grow">
            <a
              href="#responsive-header"
              class="block mt-4 lg:inline-block lg:mt-0 text-teal-lighter hover:text-white mr-4"
            >
              Docs
            </a>
            <a
              href="#responsive-header"
              class="block mt-4 lg:inline-block lg:mt-0 text-teal-lighter hover:text-white mr-4"
            >
              Examples
            </a>
            <a
              href="#responsive-header"
              class="block mt-4 lg:inline-block lg:mt-0 text-teal-lighter hover:text-white"
            >
              Blog
            </a>
          </div>
          <div>
            <a
              href="#"
              class="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal hover:bg-white mt-4 lg:mt-0"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center container">
        <div className="m-4 w-full">
          <p>Hi! {user.Name}</p>
        </div>
        {user.rooms.map((room, index) => (
          <Link href={'/user'} key={index}>
            <a>{room.name}</a>
          </Link>
        ))}
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
