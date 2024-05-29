"use client"
import { LucideIcon } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

type Props = {
  icon: LucideIcon | undefined;
  title: string;
  action: (() => any) | undefined;
  isActive: (() => any) | undefined;
};


const StyledMenuItem = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.4rem;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  margin-right: 0.5rem;
  padding: 0.5rem;
  width: 2.5rem;
  transition: background-color 0.2s;

  svg {
    height: 100%;
    width: 100%;
  }

  &:hover {
    background-color: #3b82f6;
    color: #fff;
  }

  &.is-active {
    background-color: #3b82f6;
    color: #fff;
  }
`;

const MenuItem: React.FC<any> = ({ icon: Icon, title, action, isActive, }) => {
  return (
    <StyledMenuItem
      className={isActive && isActive() ? 'is-active' : ''}
      onClick={action}
      title={title}
    >
      {Icon ? <Icon className="h-1- w-10" />: null}
    </StyledMenuItem>
  );
};

export default MenuItem;
