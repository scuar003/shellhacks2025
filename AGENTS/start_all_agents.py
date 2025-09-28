#!/usr/bin/env python3
"""
Start All ReliefOps Agents
This script starts all three agents on different ports for A2A communication
"""

import subprocess
import time
import sys
import os
from pathlib import Path

def start_agent(agent_name, port, directory):
    """Start an agent on a specific port"""
    print(f"🚀 Starting {agent_name} on port {port}...")
    
    # Change to agent directory
    agent_dir = Path(__file__).parent / directory
    os.chdir(agent_dir)
    
    # Start the agent
    try:
        process = subprocess.Popen([
            sys.executable, "-m", "adk", "web", "--port", str(port)
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print(f"✅ {agent_name} started on http://localhost:{port}")
        return process
    except Exception as e:
        print(f"❌ Failed to start {agent_name}: {e}")
        return None

def main():
    """Start all agents"""
    print("🎯 Starting ReliefOps Disaster Relief Agents")
    print("=" * 50)
    
    # Agent configurations
    agents = [
        ("Coordinator Agent", 8000, "disaster_relief/coordinator_agent"),
        ("Mapping Agent", 8002, "disaster_relief/mapping_agent"), 
        ("Logistics Agent", 8003, "disaster_relief/logistics_agent"),
    ]
    
    processes = []
    
    try:
        # Start all agents
        for name, port, directory in agents:
            process = start_agent(name, port, directory)
            if process:
                processes.append((name, process))
            time.sleep(2)  # Give each agent time to start
        
        print("\n🎉 All agents started successfully!")
        print("\n📱 Agent URLs:")
        print("  • Coordinator: http://localhost:8000")
        print("  • Mapping:     http://localhost:8002") 
        print("  • Logistics:   http://localhost:8003")
        print("\n🔗 A2A Communication enabled between agents")
        print("\nPress Ctrl+C to stop all agents")
        
        # Keep running until interrupted
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping all agents...")
        
        # Stop all processes
        for name, process in processes:
            try:
                process.terminate()
                print(f"✅ {name} stopped")
            except:
                pass
        
        print("👋 All agents stopped")

if __name__ == "__main__":
    main()
