"use client"
import React from 'react'

interface EmailTemplateProps {
    name:string,
    email: string,
    detail: string
}

const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ name, email, detail }) => {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
        <p style={{ marginBottom: '20px' }}>Hello Dennis,</p>
        <p style={{ marginBottom: '20px' }}>
          <strong>{name}</strong> has submitted the contact form on your website. Their email is <strong>{email}</strong>!
        </p>
        <p style={{ marginBottom: '20px' }}>{detail}</p>
        <p style={{ marginTop: '20px' }}>
          Regards,<br />
          Dennis Stephen Kamara
        </p>
      </div>
    );
  };
  

export default EmailTemplate
