import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { domain_db, human_icon } from '../global';
import { useRouter } from 'next/router';

export default function User(pageProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(async () => {}, []);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmitBtnClick = async (e) => {
    if (password == confirmPassword) {
      const input_info = {
        username,
        email,
        password,
      };
      const res = await fetch(`http://${domain_db}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input_info),
      }).catch(() => null);
      const json_data = await res.json().catch(() => null);
    }
  };

  return (
    <div className="bg-grey-lighter min-h-screen flex flex-col">
      <div className="container max-w-sm mx-auto flex-1 flex flex-col items-center justify-center px-2">
        <div className="bg-white px-6 py-8 rounded shadow-md text-black w-full">
          <h1 className="mb-8 text-3xl text-center">新規登録</h1>
          <input
            type="text"
            value={username}
            className="block border border-grey-light w-full p-3 rounded mb-4"
            placeholder="Username"
            onChange={handleUsernameChange}
          />

          <input
            type="text"
            className="block border border-grey-light w-full p-3 rounded mb-4"
            placeholder="Email"
            onChange={handleEmailChange}
          />

          <input
            className="block border border-grey-light w-full p-3 rounded mb-4"
            value={password}
            type="password"
            placeholder="Password"
            onChange={handlePasswordChange}
          />
          <input
            type="password"
            className="block border border-grey-light w-full p-3 rounded mb-4"
            placeholder="Confirm Password"
            onChange={handleConfirmPasswordChange}
          />

          <button
            type="submit"
            className="w-full text-center py-3 rounded bg-green-600 text-white hover:bg-green-dark focus:outline-none my-1"
            onClick={handleSubmitBtnClick}
          >
            登録
          </button>
        </div>

        <div className="text-grey-dark mt-6">
          すでにアカウントを持っていますか?　
          <Link href="/">
            <a href="#" className="no-underline border-b border-blue text-blue">
              Log in
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
