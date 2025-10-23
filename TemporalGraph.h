#include <iostream>
using namespace std;
#include <unordered_map>
#include <vector>
#include <ctime>

time_t current_time(){
    return time(nullptr);
}

class Edge{
    public:
    int destination;
    time_t timestamp;

    Edge(int val , time_t ts): destination(val),timestamp(ts){}
};

class TemporalGraph{
    private:
    unordered_map<int,vector<Edge>>adj_list;

    public:
    
    void addNode(int node){
        auto it = adj_list.find(node);
        if(it == adj_list.end()){
            vector<Edge>e;
            adj_list[node] = e;
        }
        return ;
    }
    void addEdge(int from , int to , int timestamp){
        auto it = adj_list.find(from);
        if(it == adj_list.end()){
            Edge e(to,current_time());
            adj_list[from].push_back(e);
        }
        else{
            bool ispresent = false;
            for(auto &e : adj_list[from]){
                if(e.destination == to) {
                    ispresent = true;
                    break;
                }
            }
            if(!ispresent){
                Edge e(to,current_time());
                adj_list[from].push_back(e);
            }
        }
        return ;
    }
    void removeEdge(int from , int to){
        
    }
    void printGraph();
};
