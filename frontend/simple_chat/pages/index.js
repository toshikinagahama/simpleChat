import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState, messagesState } from '../components/atoms';
import { useRecoilState } from 'recoil';

export default function Home(pageProps) {
  const router = useRouter();
  const [username, setUsername] = useState('test_user1');
  const [password, setPassword] = useState('test_user1');
  const [user, setUser] = useRecoilState(userState);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    // console.log(username);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // console.log(password);
  };

  const handleLoginBtnClick = async (e) => {
    const res = await fetch('http://localhost:1323/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }).catch(() => null);
    if (res != null) {
      const json_data = await res.json().catch(() => null);
      //console.log(json_data);
      if (json_data != null) {
        const token = json_data['token'];
        if (token != null) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join('')
          );
          const json = JSON.parse(jsonPayload);
          //console.log(json['exp']);
          let dateTime = new Date(json['exp'] * 1000);
          //console.log(dateTime.toString());
          localStorage.setItem('token', token);
          setUser(json_data);
          router.push('/user');
        } else {
        }
      }
    } else {
      alert('failed to connect server');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Simple Chat sample</title>
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="m-4">
          <p>input name</p>
        </div>
        <input className="border-2" value={username} onChange={handleUsernameChange} />
        <div className="m-4">
          <p>input password</p>
        </div>
        <input
          className="border-2"
          value={password}
          type="password"
          onChange={handlePasswordChange}
        />
        <div className="m-8">
          <button className="text-2xl" onClick={handleLoginBtnClick}>
            Login
          </button>
        </div>
      </main>
    </div>
  );
}
